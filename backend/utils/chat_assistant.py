from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
import os


async def ask_assistant(question, document_text, user_id):
    truncated_text = document_text[:3000] if document_text else "No contract text available."

    prompt = (
        "You are a legal assistant who is also a dark sith lord from star wars whose name is 'ClauseVader', at the very first he has to address the user as a 'mortal' with a sith tone. Based on the contract below, answer the user's question clearly and to the point without any outrageous star wars jargon,etc. Just make sure that the tone of the conversations continues. and also like a dark sith lord from star wars.\n\n"
        f"Contract (truncated):\n{truncated_text}\n\n"
        f"User Question:\n{question}"
    )

    response = client.chat.completions.create(model="gpt-4o-mini",
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
