let records = [];
let sdkReady = false;

function setLanguage(language) {
const russian = language === "ru";
document.body.classList.toggle("russian", russian);
document.documentElement.lang = russian ? "ru" : "en";

const enBtn = document.getElementById("en-btn");
const ruBtn = document.getElementById("ru-btn");

enBtn.className = russian ? "language-inactive rounded-sm px-3 py-2" : "language-active rounded-sm px-3 py-2";
ruBtn.className = russian ? "language-active rounded-sm px-3 py-2" : "language-inactive rounded-sm px-3 py-2";
enBtn.setAttribute("aria-pressed", String(!russian));
ruBtn.setAttribute("aria-pressed", String(russian));
}

function feedback(el, message) {
el.textContent = message;
el.classList.add("show");
}

function renderRecords(data) {
records = data;

["post-1", "post-2", "post-3"].forEach(postId => {
const likes = data.filter(r => r.type === "appreciation" && r.post_id === postId).length;
document.querySelectorAll('[data-post="' + postId + '"] .like-count').forEach(el => el.textContent = likes);

const host = document.querySelector('[data-comments="' + postId + '"]');
host.innerHTML = "";
data.filter(r => r.type === "comment" && r.post_id === postId)
.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
.forEach(record => {
const node = document.getElementById("comment-template").content.cloneNode(true);
node.querySelector(".dynamic-comment-content").textContent = record.content;
node.querySelector(".dynamic-comment-author").textContent = record.author_name;
host.appendChild(node);
});
});

const reviewHost = document.getElementById("submitted-reviews");
reviewHost.innerHTML = "";
data.filter(r => r.type === "review")
.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
.forEach(record => {
const node = document.getElementById("review-template").content.cloneNode(true);
node.querySelector(".dynamic-review-content").textContent = "“" + record.content + "”";
node.querySelector(".dynamic-review-author").textContent = record.author_name;
reviewHost.appendChild(node);
});
}

async function saveRecord(record) {
if (!sdkReady) return { isOk: false };
return await window.dataSdk.create(record);
}

document.addEventListener("DOMContentLoaded", async () => {
if (typeof lucide !== 'undefined') {
lucide.createIcons();
}

document.getElementById("en-btn").addEventListener("click", () => setLanguage("en"));
document.getElementById("ru-btn").addEventListener("click", () => setLanguage("ru"));

const observer = new IntersectionObserver(entries => {
entries.forEach(entry => {
if (entry.isIntersecting) entry.target.classList.add("visible");
});
}, { threshold: .12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

document.querySelectorAll("[data-comment-toggle]").forEach(button => {
button.addEventListener("click", () => {
const form = document.querySelector('[data-comment-form="' + button.dataset.commentToggle + '"]');
if (form) form.classList.toggle("open");
});
});

document.querySelectorAll(".like-button").forEach(button => {
button.addEventListener("click", async () => {
if (!sdkReady || records.length >= 999) return;
button.disabled = true;
const result = await saveRecord({
type: "appreciation",
author_name: "Visitor",
author_email: "",
content: "",
post_id: button.dataset.post,
likes: 1,
created_at: new Date().toISOString(),
status: "published"
});
if (!result.isOk) button.disabled = false;
});
});

document.querySelectorAll("[data-comment-form]").forEach(form => {
form.addEventListener("submit", async event => {
event.preventDefault();
if (!sdkReady || records.length >= 999) return;

const button = form.querySelector("button");
const note = form.querySelector(".form-feedback");
button.disabled = true;

const postId = form.dataset.commentForm;
const result = await saveRecord({
type: "comment",
author_name: form.querySelector('input[type="text"]').value.trim(),
author_email: form.querySelector('input[type="email"]').value.trim(),
content: form.querySelector("textarea").value.trim(),
post_id: postId,
likes: 0,
created_at: new Date().toISOString(),
status: "published"
});

if (result.isOk) {
form.reset();
feedback(note, document.body.classList.contains("russian") ? "Комментарий опубликован." : "Your comment has been published.");
} else {
button.disabled = false;
feedback(note, document.body.classList.contains("russian") ? "Не удалось сохранить комментарий." : "Unable to save your comment.");
}
});
});

document.getElementById("review-form").addEventListener("submit", async event => {
event.preventDefault();
const form = event.currentTarget;
const status = document.getElementById("review-status");
const buttons = form.querySelectorAll("button");
buttons.forEach(b => b.disabled = true);

const result = await saveRecord({
type: "review",
author_name: document.getElementById("review-name").value.trim(),
author_email: document.getElementById("review-email").value.trim(),
content: document.getElementById("review-content").value.trim(),
post_id: "",
likes: 0,
created_at: new Date().toISOString(),
status: "published"
});

if (result.isOk) {
form.reset();
feedback(status, document.body.classList.contains("russian") ? "Спасибо за ваш отзыв." : "Thank you for your review.");
} else {
buttons.forEach(b => b.disabled = false);
feedback(status, document.body.classList.contains("russian") ? "Не удалось сохранить отзыв." : "Unable to save your review.");
}
});

document.getElementById("contact-form").addEventListener("submit", async event => {
event.preventDefault();
const form = event.currentTarget;
const status = document.getElementById("contact-status");
const buttons = form.querySelectorAll("button");
buttons.forEach(b => b.disabled = true);

const result = await saveRecord({
type: "enquiry",
author_name: document.getElementById("contact-name").value.trim(),
author_email: document.getElementById("contact-email").value.trim(),
content: document.getElementById("contact-message").value.trim(),
post_id: "",
likes: 0,
created_at: new Date().toISOString(),
status: "new"
});

if (result.isOk) {
form.reset();
feedback(status, document.body.classList.contains("russian") ? "Спасибо. Ваше сообщение отправлено." : "Thank you. Your message has been received.");
} else {
buttons.forEach(b => b.disabled = false);
feedback(status, document.body.classList.contains("russian") ? "Не удалось отправить сообщение." : "Unable to send your message.");
}
});

try {
const initResult = await window.dataSdk.init({ onDataChanged: renderRecords });
sdkReady = initResult.isOk;
} catch (e) {
console.log("Data SDK not available");
}
});