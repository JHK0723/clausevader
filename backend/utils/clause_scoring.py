import json
import os
import uuid
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_clauses(text, role="unsure"):
    prompt = f"""
You are a contract analysis AI. Extract key clauses from this contract and analyze them.

For each clause, return a JSON object with:
- summary: a one-line explanation of the clause
- pros: list of bullet-pointed pros from the user's perspective
- cons: list of bullet-pointed cons from the user's perspective
- suggested_rewrite: optional improved version of the clause (string)
- sith_view: how a dark Sith lord would interpret this clause (string)
- x: float between 0 (user-favourable) to 1 (issuer-favourable)
- y: float between 0 (neutral/low risk) to 1 (high risk)
- impact: one of "favourable", "neutral", or "unfavourable"

Respond ONLY with a JSON list. No explanations or preamble.

Contract Text (truncated to 4000 chars):
{text[:4000]}
"""

    # # Toggle caching for testing without burning tokens
    # use_cache = True
    # if use_cache:
    #     with open("utils/sample_ret.json") as f:
    #         sample_ret = json.load(f)
    #         for clause in sample_ret["clause_graph"]:
    #             clause["id"] = str(uuid.uuid4())
    #         return sample_ret

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4
    )

    try:
        content = response.choices[0].message.content
        result = json.loads(content)
    except Exception:
        return {
            "error": True,
            "message": response.choices[0].message.content
        }

    # Assign UUIDs to each clause
    for clause in result:
        clause["id"] = str(uuid.uuid4())

    # Calculate favourability score (0 = bad for user, 100 = best for user)
    score = int(sum([(1 - clause["x"]) for clause in result]) / len(result) * 100)

    ret = {
        "favourability_score": score,
        "clause_graph": result
    }

    print(json.dumps(ret, indent=2))
    return ret
