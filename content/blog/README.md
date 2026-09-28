# ChargeWeave blog content

Write posts as Markdown in `articles/`. The site builds one public page for each article marked `published: true`. Only published article text and referenced images are included in the site build; draft articles and unused image files stay in the repository.

## Add an article

1. Copy `article-template.md` into `articles/` and give it a URL-friendly name, such as `why-operational-context-matters.md`.
2. Fill in the front matter. Use an ISO date (`YYYY-MM-DD`) and one of the categories shown below.
3. Write the article body in Markdown. Standard headings, links, lists, blockquotes, fenced code and images are supported.
4. Put image files in `assets/<article-slug>/` and link them relative to the article. For example, from `articles/why-operational-context-matters.md`, use `![A connected operating view](../assets/why-operational-context-matters/network-view.png)`.
5. Set `published: true` when it is ready for the next site build. A draft can remain `false`.

The renderer builds safe React elements from supported Markdown instead of inserting raw article HTML. PNG, JPG, WebP, GIF and SVG images are copied to stable public URLs under `/blog/assets/`. The LinkedIn copy button rewrites local image paths to those public URLs. LinkedIn may still require image files to be uploaded separately in its composer.

## Categories

- Charging operations
- Platform architecture
- Commercial models
- Energy & flexibility
- Interoperability

## LinkedIn handoff

Open the article on the website and choose **Copy Markdown**. This copies the title, summary, article text and public image links. The Markdown file remains the source of truth; edit the Markdown in this folder and commit it with any accompanying assets.
