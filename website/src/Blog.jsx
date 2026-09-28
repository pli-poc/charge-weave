import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Copy, FileText } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { articleMarkdown, articles, categories, markdownForLinkedIn } from "./blog-content.js";
import "./blog.css";

const base = import.meta.env.BASE_URL;
const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" });

function ArticleCard({ article }) {
  return (
    <article className="insight-card">
      <div className="insight-card-meta">
        <span>{article.category}</span>
        <time dateTime={article.date}>{dateFormat.format(new Date(`${article.date}T00:00:00Z`))}</time>
      </div>
      <h2><a href={`${base}blog/${article.slug}/`}>{article.title}</a></h2>
      <p>{article.summary}</p>
      <a className="insight-read" href={`${base}blog/${article.slug}/`}>
        Read article <ArrowUpRight size={16} />
      </a>
    </article>
  );
}

function IndexPage() {
  const [category, setCategory] = useState("All topics");
  const visible = useMemo(
    () => category === "All topics" ? articles : articles.filter((article) => article.category === category),
    [category],
  );
  return (
    <main id="main" className="insights-page">
      <header className="insights-heading">
        <div className="container">
          <p className="eyebrow">ChargeWeave insights</p>
          <h1>Ideas for a more connected charging business.</h1>
          <p className="insights-intro">Perspectives on operating charge-point networks, connecting systems and making commercial outcomes easier to explain.</p>
          <div className="insights-topics" role="group" aria-label="Filter articles by topic">
            {["All topics", ...categories].map((item) => (
              <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
        </div>
      </header>
      <section className="container insights-results" aria-live="polite">
        <div className="insights-results-heading"><span>{category}</span><span>{visible.length} {visible.length === 1 ? "article" : "articles"}</span></div>
        {visible.length ? (
          <div className="insight-grid">{visible.map((article) => <ArticleCard key={article.slug} article={article} />)}</div>
        ) : (
          <div className="insights-empty"><FileText size={24} /><p>No articles in this topic yet.</p><span>Choose another topic or check back soon.</span></div>
        )}
        <p className="insights-authoring-note">Articles are written in Markdown, with images stored alongside the blog content.</p>
      </section>
    </main>
  );
}

function NotFound() {
  return <main id="main" className="container insight-not-found"><p className="eyebrow">Insights</p><h1>Article not found</h1><a href={`${base}blog/`}><ArrowLeft size={16} /> Back to all articles</a></main>;
}

function ArticlePage({ article }) {
  const [copied, setCopied] = useState(false);
  const bodyHtml = useMemo(() => DOMPurify.sanitize(marked.parse(articleMarkdown(article))), [article]);
  useEffect(() => {
    document.title = `${article.title} — ChargeWeave Insights`;
    return () => { document.title = "ChargeWeave — Connected charging operations"; };
  }, [article.title]);
  async function copyForLinkedIn() {
    try {
      await navigator.clipboard.writeText(markdownForLinkedIn(article));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }
  return (
    <main id="main" className="insight-article-page">
      <div className="container">
        <a className="insight-back" href={`${base}blog/`}><ArrowLeft size={16} /> All insights</a>
        <article>
          <header className="insight-article-heading">
            <div className="insight-card-meta"><span>{article.category}</span><time dateTime={article.date}>{dateFormat.format(new Date(`${article.date}T00:00:00Z`))}</time></div>
            <h1>{article.title}</h1>
            <p>{article.summary}</p>
            {article.author && <span className="insight-author">By {article.author}</span>}
          </header>
          <div className="insight-copy-bar">
            <div><strong>Share this article</strong><span>Copy the Markdown for your LinkedIn post.</span></div>
            <button type="button" onClick={copyForLinkedIn} aria-live="polite">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy Markdown"}</button>
          </div>
          <p className="insight-image-note">Image links are included in the copied text. LinkedIn may ask you to upload each image separately.</p>
          <div className="insight-prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </article>
      </div>
    </main>
  );
}

export default function Blog({ route }) {
  if (route === "blog" || route === "blog/") return <IndexPage />;
  const slug = route.replace(/^blog\//, "").replace(/\/$/, "");
  const article = articles.find((item) => item.slug === slug);
  return article ? <ArticlePage article={article} /> : <NotFound />;
}
