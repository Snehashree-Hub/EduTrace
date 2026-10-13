import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Brain,
  FileText,
  GraduationCap,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import "./knowledge.css";

const API_URL = "http://127.0.0.1:8001";

function Knowledge() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [error, setError] = useState("");

  async function loadDocuments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/knowledge/documents`
      );

      if (!response.ok) {
        throw new Error("Unable to load Knowledge Vault.");
      }

      const data = await response.json();

      setDocuments(
        Array.isArray(data.documents)
          ? data.documents
          : []
      );
    } catch (err) {
      setError(
        err.message ||
        "Unable to load Knowledge Vault."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/knowledge/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.detail ||
          result.message ||
          "PDF upload failed."
        );
      }

      await loadDocuments();
    } catch (err) {
      setError(
        err.message ||
        "PDF upload failed."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function learnWithAI(document) {
    const documentId =
      document.document_id ||
      document.id;

    const documentName =
      document.filename ||
      document.name ||
      "Knowledge Vault document";

    const message =
      `Teach me the important concepts from "${documentName}". ` +
      `Start with the main concepts, explain them simply, ` +
      `give examples, important points, and important exam questions. ` +
      `Use my uploaded document as the primary source.`;

    navigate("/ai-assistant", {
      state: {
        autoStart: true,

        studyPlanContext: {
          preparationType: "Knowledge Vault",

          examGoal: "Document Learning",

          subject: documentName,

          topic: "Document Concepts",

          documentName,

          documentId,

          documentType:
            document.document_type ||
            document.documentType ||
            "PDF",

          source: "Knowledge Vault",

          useRag: true,

          message,
        },
      },
    });
  }

  const filteredDocuments =
    documents.filter((document) => {
      const name =
        document.filename ||
        document.name ||
        "";

      return name
        .toLowerCase()
        .includes(
          searchQuery.toLowerCase()
        );
    });

  return (
    <div className="knowledge-page">

      <section className="knowledge-hero">

        <div className="knowledge-hero-content">

          <div className="knowledge-icon">
            <Brain size={28} />
          </div>

          <div>
            <p className="knowledge-eyebrow">
              EDU TRACE KNOWLEDGE VAULT
            </p>

            <h1>
              Your learning material,
              <span> made interactive.</span>
            </h1>

            <p className="knowledge-description">
              Upload your study material and let
              EduTrace AI explain concepts,
              create important questions and
              teach directly from your documents.
            </p>
          </div>

        </div>

        <label className="knowledge-upload-button">

          {uploading ? (
            <>
              <Loader2
                size={18}
                className="spin"
              />
              Processing...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload PDF
            </>
          )}

          <input
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={handleUpload}
            disabled={uploading}
          />

        </label>

      </section>

      {error && (
        <div className="knowledge-error">
          <X size={18} />
          {error}
        </div>
      )}

      <section className="knowledge-toolbar">

        <div className="knowledge-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search your knowledge..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
          />

        </div>

        <div className="knowledge-count">
          <FileText size={16} />
          {documents.length} material
          {documents.length !== 1
            ? "s"
            : ""}
        </div>

      </section>

      {loading ? (
        <div className="knowledge-loading">

          <Loader2
            size={28}
            className="spin"
          />

          <p>
            Loading your Knowledge Vault...
          </p>

        </div>
      ) : filteredDocuments.length === 0 ? (

        <section className="knowledge-empty">

          <div className="empty-icon">
            <BookOpen size={34} />
          </div>

          <h2>
            Your Knowledge Vault is empty
          </h2>

          <p>
            Upload a PDF to start learning
            directly from your own material.
          </p>

          <label className="empty-upload">

            <Plus size={18} />
            Add Study Material

            <input
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={handleUpload}
            />

          </label>

        </section>

      ) : (

        <section className="knowledge-grid">

          {filteredDocuments.map(
            (document, index) => {

              const documentId =
                document.document_id ||
                document.id;

              const documentName =
                document.filename ||
                document.name ||
                `Document ${index + 1}`;

              const pageCount =
                document.page_count ||
                document.pages ||
                0;

              const chunkCount =
                document.chunk_count ||
                document.chunks ||
                0;

              return (
                <article
                  className="knowledge-card"
                  key={
                    documentId ||
                    `${documentName}-${index}`
                  }
                >

                  <div className="document-top">

                    <div className="pdf-icon">
                      <FileText size={25} />
                    </div>

                    <span className="pdf-badge">
                      PDF
                    </span>

                  </div>

                  <h3>
                    {documentName}
                  </h3>

                  <div className="document-meta">

                    <span>
                      {pageCount} pages
                    </span>

                    <span>
                      {chunkCount} chunks
                    </span>

                  </div>

                  <div className="document-id">
                    {documentId}
                  </div>

                  <div className="document-actions">

                    <button
                      className="document-preview"
                      onClick={() =>
                        setSelectedDocument(
                          document
                        )
                      }
                    >
                      <FileText size={16} />
                      Preview
                    </button>

                    <button
                      className="learn-button"
                      onClick={() =>
                        learnWithAI(
                          document
                        )
                      }
                    >
                      <Sparkles size={16} />
                      Learn with AI
                    </button>

                  </div>

                </article>
              );
            }
          )}

        </section>
      )}

      {selectedDocument && (

        <div
          className="knowledge-modal-backdrop"
          onClick={() =>
            setSelectedDocument(null)
          }
        >

          <div
            className="knowledge-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setSelectedDocument(null)
              }
            >
              <X size={20} />
            </button>

            <div className="modal-icon">
              <FileText size={28} />
            </div>

            <p className="modal-label">
              KNOWLEDGE MATERIAL
            </p>

            <h2>
              {selectedDocument.filename ||
                selectedDocument.name}
            </h2>

            <div className="modal-info">

              <div>
                <strong>
                  Document ID
                </strong>

                <span>
                  {selectedDocument.document_id ||
                    selectedDocument.id}
                </span>
              </div>

              <div>
                <strong>
                  Pages
                </strong>

                <span>
                  {selectedDocument.page_count ||
                    selectedDocument.pages ||
                    0}
                </span>
              </div>

              <div>
                <strong>
                  Chunks
                </strong>

                <span>
                  {selectedDocument.chunk_count ||
                    selectedDocument.chunks ||
                    0}
                </span>
              </div>

            </div>

            <button
              className="modal-learn-button"
              onClick={() => {
                const document =
                  selectedDocument;

                setSelectedDocument(null);

                learnWithAI(document);
              }}
            >
              <MessageCircle size={18} />
              Learn this document with AI
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default Knowledge;

