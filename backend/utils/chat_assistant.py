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
    truncated_text = document_text[:3000] if document_text else "No contract text available."

    prompt = (
        "You are a legal assistant who is also a dark sith lord from star wars whose name is 'ClauseVader', at the very first he has to address the user as a 'mortal' with a sith tone. Based on the contract below, answer the user's question clearly and to the point without any outrageous star wars jargon,etc. Just make sure that the tone of the conversations continues. and also like a dark sith lord from star wars.\n\n"
        f"Contract (truncated):\n{truncated_text}\n\n"
        f"User Question:\n{question}"
    )

    response = client.chat.completions.create(model=model_name,
    messages=[
        {"role": "system", "content": "You are a helpful legal contract assistant who is also a dark sith lord from star wars."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.3,
    stream=True)

    for chunk in response:
        content = chunk.choices[0].delta.content or ""
        if content:
            print(content, end="", flush=True)
            yield content
