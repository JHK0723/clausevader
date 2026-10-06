import json
import os
import uuid
from openai import OpenAI

api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
base_url = os.getenv("LLM_BASE_URL")

# Auto-detect OpenRouter if base_url is not set but key is OpenRouter
if not base_url and (os.getenv("OPENROUTER_API_KEY") or (api_key and api_key.startswith("sk-or-v1-"))):
    base_url = "https://openrouter.ai/api/v1"

# Default model: if using OpenRouter, use a top free model; otherwise default to gpt-4o-mini
default_model = "liquid/lfm-2.5-2.6b:free" if base_url and "openrouter" in base_url else "gpt-4o-mini"
model_name = os.getenv("LLM_MODEL", default_model)

client_kwargs = {"api_key": api_key or "dummy_key"}
if base_url:
    client_kwargs["base_url"] = base_url

client = OpenAI(**client_kwargs)

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
        model=model_name,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4
    )

    try:
        content = response.choices[0].message.content or ""
        # Clean markdown code blocks if present (e.g. ```json ... ```)
        cleaned_content = content.strip()
        if cleaned_content.startswith("```"):
            cleaned_content = cleaned_content.split("\n", 1)[-1]
        if cleaned_content.endswith("```"):
            cleaned_content = cleaned_content.rsplit("```", 1)[0]
        cleaned_content = cleaned_content.strip()

        result = json.loads(cleaned_content)
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
