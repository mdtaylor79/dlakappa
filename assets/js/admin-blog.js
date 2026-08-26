window.Blog = (function () {
  let quill = null;
  let editorMode = "rich";
  let editId = null;
  let didInit = false;

  function init() {
    if (didInit) return;
    didInit = true;

    quill = new Quill("#quill-editor", {
      theme: "snow",
      placeholder: "Write or paste your post content here…",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          [{ size: ["small", false, "large", "huge"] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          ["clean"],
        ],
        clipboard: { matchVisual: false },
      },
    });

    document.getElementById("postTitle").addEventListener("input", function () {
      if (editId) return;
      document.getElementById("postSlug").value = this.value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    });

    document.getElementById("postCover").addEventListener("input", (e) => onCoverUrlInput(e.target.value));
    document.getElementById("browseCoverBtn").addEventListener("click", () => document.getElementById("coverFileInput").click());
    document.getElementById("coverFileInput").addEventListener("change", (e) => handleCoverUpload(e.target));

    document.getElementById("btnRichText").addEventListener("click", () => switchEditor("rich"));
    document.getElementById("btnHtml").addEventListener("click", () => switchEditor("html"));

    document.getElementById("btnPublish").addEventListener("click", () => savePost(true));
    document.getElementById("btnDraft").addEventListener("click", () => savePost(false));
    document.getElementById("btnCancel").addEventListener("click", resetForm);

    loadPosts();
  }

  function onCoverUrlInput(url) {
    if (url) {
      document.getElementById("coverPreviewImg").src = url;
      document.getElementById("coverPreview").style.display = "block";
    } else {
      document.getElementById("coverPreview").style.display = "none";
    }
  }

  async function handleCoverUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById("coverPreviewImg").src = e.target.result;
      document.getElementById("coverPreview").style.display = "block";
    };
    reader.readAsDataURL(file);

    const progressWrap = document.getElementById("coverUploadProgress");
    const progressBar = document.getElementById("coverProgressBar");
    const uploadMsg = document.getElementById("coverUploadMsg");
    progressWrap.style.display = "block";
    progressBar.style.width = "30%";
    uploadMsg.textContent = "Uploading…";

    const ext = file.name.split(".").pop().toLowerCase();
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const fileName = `${Date.now()}-${base}.${ext}`;

    const { data, error } = await dlaSupabase.storage.from("blog-images").upload(fileName, file, { contentType: file.type, upsert: false });

    if (error) {
      progressBar.style.width = "100%";
      progressBar.style.background = "#cc0000";
      uploadMsg.textContent = "Upload failed: " + error.message;
      return;
    }

    progressBar.style.width = "100%";
    uploadMsg.textContent = "Upload complete!";
    setTimeout(() => { progressWrap.style.display = "none"; progressBar.style.width = "0%"; progressBar.style.background = "#70110c"; }, 2500);

    const { data: urlData } = dlaSupabase.storage.from("blog-images").getPublicUrl(data.path);
    document.getElementById("postCover").value = urlData.publicUrl;
    document.getElementById("coverPreviewImg").src = urlData.publicUrl;
  }

  function switchEditor(mode) {
    if (mode === editorMode) return;
    editorMode = mode;
    const quillEl = document.getElementById("quill-editor");
    const htmlEl = document.getElementById("postContentHtml");
    const hint = document.getElementById("editorHint");
    const toolbar = document.querySelector("#panel-blog .ql-toolbar");

    if (mode === "html") {
      htmlEl.value = quill.root.innerHTML === "<p><br></p>" ? "" : quill.root.innerHTML;
      quillEl.style.display = "none";
      if (toolbar) toolbar.style.display = "none";
      htmlEl.style.display = "block";
      document.getElementById("btnRichText").classList.remove("active");
      document.getElementById("btnHtml").classList.add("active");
      hint.textContent = "Write raw HTML. Use <p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>, <blockquote>, <img>.";
    } else {
      const html = htmlEl.value.trim();
      if (html) quill.root.innerHTML = html;
      htmlEl.style.display = "none";
      quillEl.style.display = "block";
      if (toolbar) toolbar.style.display = "block";
      document.getElementById("btnHtml").classList.remove("active");
      document.getElementById("btnRichText").classList.add("active");
      hint.textContent = "Write or paste content. Paste from Word or Google Docs and formatting will be preserved. Scroll within the content area.";
    }
  }

  function showStatus(msg, type) {
    const el = document.getElementById("statusMsg");
    el.textContent = msg;
    el.className = `status-msg ${type}`;
    el.style.display = "block";
    if (type === "success") setTimeout(() => el.style.display = "none", 4000);
  }

  function toDatetimeLocal(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function resetForm() {
    editId = null;
    ["postTitle", "postSlug", "postExcerpt", "postCover", "postCoverAlt", "postAuthor", "postSeoTitle", "postCanonical"].forEach((id) => document.getElementById(id).value = "");
    document.getElementById("postCategory").value = "news";
    document.getElementById("postDate").value = "";
    quill.setContents([]);
    document.getElementById("postContentHtml").value = "";
    document.getElementById("membersOnly").checked = false;
    document.getElementById("coverPreview").style.display = "none";
    document.getElementById("coverPreviewImg").src = "";
    document.getElementById("coverFileInput").value = "";
    document.getElementById("formHeading").textContent = "Blog Admin";
    document.getElementById("formSubtitle").textContent = "Create and manage chapter blog posts.";
    document.getElementById("btnPublish").textContent = "Publish Now";
    document.getElementById("btnDraft").style.display = "";
    document.getElementById("btnCancel").style.display = "none";
    document.getElementById("statusMsg").style.display = "none";
    document.getElementById("formHeading").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function editPost(id) {
    const { data: p, error } = await dlaSupabase.from("posts").select("*").eq("id", id).single();
    if (error || !p) { showStatus("Could not load post.", "error"); return; }

    editId = id;
    document.getElementById("postTitle").value = p.title || "";
    document.getElementById("postSlug").value = p.slug || "";
    document.getElementById("postExcerpt").value = p.excerpt || "";
    document.getElementById("postCover").value = p.cover_image || "";
    document.getElementById("postCoverAlt").value = p.cover_alt || "";
    document.getElementById("postAuthor").value = p.author || "";
    document.getElementById("postCategory").value = p.category || "news";
    document.getElementById("postDate").value = toDatetimeLocal(p.published_at);
    document.getElementById("postSeoTitle").value = p.seo_title || "";
    document.getElementById("postCanonical").value = p.canonical_url || "";
    document.getElementById("membersOnly").checked = !!p.is_members_only;

    if (p.cover_image) {
      document.getElementById("coverPreviewImg").src = p.cover_image;
      document.getElementById("coverPreview").style.display = "block";
    } else {
      document.getElementById("coverPreview").style.display = "none";
    }

    if (editorMode === "rich") quill.root.innerHTML = p.content || "";
    else document.getElementById("postContentHtml").value = p.content || "";

    document.getElementById("formHeading").textContent = "Edit Post";
    document.getElementById("formSubtitle").textContent = "Editing: " + p.title;
    document.getElementById("btnPublish").textContent = p.published ? "Update & Keep Live" : "Update & Publish";
    document.getElementById("btnDraft").style.display = p.published ? "none" : "";
    document.getElementById("btnCancel").style.display = "";

    document.getElementById("formHeading").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function savePost(publish) {
    const title = document.getElementById("postTitle").value.trim();
    const slug = document.getElementById("postSlug").value.trim();
    const content = editorMode === "html"
      ? document.getElementById("postContentHtml").value.trim()
      : quill.root.innerHTML.trim();

    if (!title || !slug || !content || content === "<p><br></p>") {
      showStatus("Title, slug, and content are required.", "error"); return;
    }

    const btn = document.getElementById("btnPublish");
    btn.disabled = true;

    const dateVal = document.getElementById("postDate").value;
    const publishedAt = dateVal
      ? new Date(dateVal).toISOString()
      : (publish ? new Date().toISOString() : null);

    const payload = {
      title,
      slug,
      excerpt: document.getElementById("postExcerpt").value.trim() || null,
      content,
      cover_image: document.getElementById("postCover").value.trim() || null,
      cover_alt: document.getElementById("postCoverAlt").value.trim() || null,
      seo_title: document.getElementById("postSeoTitle").value.trim() || null,
      canonical_url: document.getElementById("postCanonical").value.trim() || null,
      category: document.getElementById("postCategory").value,
      author: document.getElementById("postAuthor").value.trim() || "DLA Chapter Administration",
      is_members_only: document.getElementById("membersOnly").checked,
      published: publish,
      published_at: publishedAt,
    };

    let error;
    if (editId) {
      ({ error } = await dlaSupabase.from("posts").update(payload).eq("id", editId));
    } else {
      ({ error } = await dlaSupabase.from("posts").insert(payload));
    }

    btn.disabled = false;
    if (error) {
      showStatus(error.message, "error");
    } else {
      showStatus(`Post ${editId ? "updated" : (publish ? "published" : "saved as draft")} successfully!`, "success");
      resetForm();
      loadPosts();
    }
  }

  async function togglePublish(id, currentState) {
    await dlaSupabase.from("posts").update({
      published: !currentState,
      published_at: !currentState ? new Date().toISOString() : null,
    }).eq("id", id);
    loadPosts();
  }

  async function deletePost(id, title) {
    if (!confirm(`Delete "${title}"?\n\nThis cannot be undone.`)) return;
    const { error } = await dlaSupabase.from("posts").delete().eq("id", id);
    if (error) { showStatus("Delete failed: " + error.message, "error"); }
    else { showStatus("Post deleted.", "success"); if (editId === id) resetForm(); loadPosts(); }
  }

  async function loadPosts() {
    const { data: posts } = await dlaSupabase
      .from("posts")
      .select("id, title, slug, category, is_members_only, published, published_at, created_at")
      .order("published_at", { ascending: false });

    const container = document.getElementById("postsList");
    if (!posts || !posts.length) {
      container.innerHTML = '<p style="font-size:.84rem;color:#aaa;">No posts yet.</p>';
      return;
    }

    const CATS = { "news": "News", "chapter-news": "Chapter News", "event-recap": "Event Recap", "member-spotlight": "Member Spotlight", "guide-right": "Guide Right" };

    container.innerHTML = posts.map((p) => `
      <div class="post-row">
        <div class="post-row-info">
          <h3>${p.title}
            <span class="badge ${p.published ? "badge-live" : "badge-draft"}">${p.published ? "Live" : "Draft"}</span>
            ${p.is_members_only ? '<span class="badge badge-members">Members</span>' : ""}
          </h3>
          <div class="meta">${CATS[p.category] || p.category} &middot; ${p.published_at ? new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No date"}</div>
        </div>
        <div class="post-row-actions">
          ${p.published ? `<button class="btn-sm btn-view" data-view-post="${p.slug}">View</button>` : ""}
          <button class="btn-sm btn-edit" data-edit-post="${p.id}">Edit</button>
          <button class="btn-sm ${p.published ? "btn-unpublish" : "btn-publish-sm"}" data-toggle-post="${p.id}" data-published="${p.published}">
            ${p.published ? "Unpublish" : "Publish"}
          </button>
          <button class="btn-sm btn-delete" data-delete-post="${p.id}" data-title="${escapeAttr(p.title)}">Delete</button>
        </div>
      </div>`).join("");

    container.querySelectorAll("[data-view-post]").forEach((b) => b.addEventListener("click", () => window.open(`/blog/post.html?slug=${b.dataset.viewPost}`, "_blank")));
    container.querySelectorAll("[data-edit-post]").forEach((b) => b.addEventListener("click", () => editPost(b.dataset.editPost)));
    container.querySelectorAll("[data-toggle-post]").forEach((b) => b.addEventListener("click", () => togglePublish(b.dataset.togglePost, b.dataset.published === "true")));
    container.querySelectorAll("[data-delete-post]").forEach((b) => b.addEventListener("click", () => deletePost(b.dataset.deletePost, b.dataset.title)));
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  return { init };
})();
