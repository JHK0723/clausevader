import os
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


async def ask_assistant(question, document_text, user_id):
    truncated_text = document_text[:4000] if document_text else "No contract text available."

    system_instruction = (
        "You are ClauseVader, an authoritative Sith Lord and ruthless contract legal strategist. "
        "You speak with dark, imposing authority, deep practical wisdom, and absolute clarity. "
        "IMPORTANT RULES:\n"
        "1. Speak naturally as a commanding Sith Master. NEVER write roleplay stage directions, asterisk actions, or emotive descriptors (do NOT use *leans back*, *eyes glow*, *smiles darkly*, etc.).\n"
        "2. Do NOT use riddles or bizarre metaphors. Use simple, direct, forceful language that cuts directly to the point.\n"
        "3. Address the user directly as 'Mortal' or by their name if known.\n"
        "4. Provide realistic, razor-sharp legal analysis of the contract: identify dangerous clauses, explain real-world consequences, uncover power imbalances, and advise how to protect their interests or counter the opposing party.\n"
        "5. Structure complex advice with clean bold bullet points so it is effortless to read."
    )

    prompt = f"Contract Text (truncated):\n{truncated_text}\n\nUser Question:\n{question}"

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ],
        temperature=0.35,
        stream=True
    )

    for chunk in response:
        content = chunk.choices[0].delta.content or ""
        if content:
            yield content

