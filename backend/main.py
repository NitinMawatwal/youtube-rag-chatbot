from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os

from youtube_transcript_api import YouTubeTranscriptApi
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

vector_store = None

class URLRequest(BaseModel):
    url: str

class QuestionRequest(BaseModel):
    question: str


def extract_video_id(url: str):
    if "v=" in url:
        return url.split("v=")[1].split("&")[0]
    elif "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0]
    else:
        raise ValueError("Invalid YouTube URL")


@app.post("/load")
async def load_video(req: URLRequest):
    global vector_store

    try:
        video_id = extract_video_id(req.url)
        ytt = YouTubeTranscriptApi()
        fetched = ytt.fetch(video_id)
        text = " ".join([t.text for t in fetched])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Transcript error: {str(e)}")

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.create_documents([text])

    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vector_store = FAISS.from_documents(chunks, embeddings)

    return {"message": "Video loaded successfully!"}


@app.post("/ask")
async def ask_question(req: QuestionRequest):
    global vector_store

    if vector_store is None:
        raise HTTPException(status_code=400, detail="No video loaded yet.")

    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.3-70b-versatile"
    )

    prompt = ChatPromptTemplate.from_template("""
    Answer the question based only on the context below.
    
    Context: {context}
    
    Question: {question}
    """)

    retriever = vector_store.as_retriever()

    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    answer = chain.invoke(req.question)
    return {"answer": answer}