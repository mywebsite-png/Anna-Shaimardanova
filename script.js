let records = [];
let sdkReady = false;

// ============================================================
// LANGUAGE TOGGLE
// ============================================================
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

// ============================================================
// RENDER RECORDS
// ============================================================
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
    if (reviewHost) {
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
}

// ============================================================
// SAVE RECORD (with local fallback)
// ============================================================
async function saveRecord(record) {
    if (!sdkReady) {
        // Local fallback: save to localStorage
        try {
            const localRecords = JSON.parse(localStorage.getItem('business_immersion_records') || '[]');
            const newRecord = {
                ...record,
                id: 'local_' + Date.now(),
                created_at: record.created_at || new Date().toISOString()
            };
            localRecords.push(newRecord);
            localStorage.setItem('business_immersion_records', JSON.stringify(localRecords));
            renderRecords(localRecords);
            return { isOk: true, data: newRecord };
        } catch (e) {
            console.warn('Local storage fallback failed:', e);
            return { isOk: false };
        }
    }
    return await window.dataSdk.create(record);
}

// ============================================================
// HEART (LIKE) BUTTON - FIXED
// ============================================================
function toggleHeart(button) {
    const countSpan = button.querySelector('.like-count');
    const heartIcon = button.querySelector('.heart-icon');

    if (!countSpan) return;

    let count = parseInt(countSpan.textContent, 10);

    if (button.classList.contains('liked')) {
        button.classList.remove('liked');
        count -= 1;
        // Empty heart
        if (heartIcon) {
            heartIcon.setAttribute('fill', 'none');
            heartIcon.setAttribute('stroke', 'currentColor');
        }
    } else {
        button.classList.add('liked');
        count += 1;
        // Filled heart
        if (heartIcon) {
            heartIcon.setAttribute('fill', '#e74c3c');
            heartIcon.setAttribute('stroke', '#e74c3c');
        }
    }
    countSpan.textContent = count;
}

// ============================================================
// DOM CONTENT LOADED
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {

    // Load local records from localStorage
    try {
        const localRecords = JSON.parse(localStorage.getItem('business_immersion_records') || '[]');
        if (localRecords.length > 0) {
            renderRecords(localRecords);
        }
    } catch (e) {
        console.warn('Could not load local records:', e);
    }

    // Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Language buttons
    document.getElementById("en-btn").addEventListener("click", () => setLanguage("en"));
    document.getElementById("ru-btn").addEventListener("click", () => setLanguage("ru"));

    // Set default language
    setLanguage("en");

    // =============================================
    // SCROLL REVEAL
    // =============================================
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add("visible");
        });
    }, { threshold: .12 });
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

    // =============================================
    // COMMENT TOGGLE
    // =============================================
    document.querySelectorAll("[data-comment-toggle]").forEach(button => {
        button.addEventListener("click", () => {
            const form = document.querySelector('[data-comment-form="' + button.dataset.commentToggle + '"]');
            if (form) {
                form.classList.toggle("open");
                form.style.display = form.classList.contains("open") ? 'block' : 'none';
            }
        });
    });

    // =============================================
    // HEART BUTTON - FIXED (visual only)
    // =============================================
    document.querySelectorAll(".like-button").forEach(button => {
        // Check if the button already has a heart-icon
        const heartIcon = button.querySelector('.heart-icon');
        
        // If no heart-icon exists, try to find a Lucide icon and replace it
        if (!heartIcon) {
            const lucideIcon = button.querySelector('i[data-lucide="heart"]');
            if (lucideIcon) {
                // Convert Lucide icon to inline SVG
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('class', 'heart-icon h-4 w-4');
                svg.setAttribute('viewBox', '0 0 24 24');
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', 'currentColor');
                svg.setAttribute('stroke-width', '2');
                svg.setAttribute('stroke-linecap', 'round');
                svg.setAttribute('stroke-linejoin', 'round');
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z');
                svg.appendChild(path);
                lucideIcon.parentNode.replaceChild(svg, lucideIcon);
            }
        }

        // Remove any existing click listeners by cloning
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // Add click listener to the new button
        newButton.addEventListener("click", function(e) {
            e.stopPropagation();
            e.preventDefault();

            // Toggle visual heart
            toggleHeart(this);

            // Also try to save to backend (if available)
            if (sdkReady && records.length < 999) {
                const postId = this.dataset.post || 'post-1';
                saveRecord({
                    type: "appreciation",
                    author_name: "Visitor",
                    author_email: "",
                    content: "",
                    post_id: postId,
                    likes: 1,
                    created_at: new Date().toISOString(),
                    status: "published"
                }).catch(() => {
                    // Silently fail - visual heart already updated
                });
            }
        });
    });

    // =============================================
    // COMMENT SUBMIT
    // =============================================
    document.querySelectorAll("[data-comment-form]").forEach(form => {
        form.addEventListener("submit", async event => {
            event.preventDefault();
            if (!sdkReady && !localStorage) return;

            const button = form.querySelector("button");
            const note = form.querySelector(".form-feedback");
            if (button) button.disabled = true;

            const postId = form.dataset.commentForm;
            const nameInput = form.querySelector('input[type="text"]');
            const emailInput = form.querySelector('input[type="email"]');
            const contentInput = form.querySelector("textarea");

            const result = await saveRecord({
                type: "comment",
                author_name: nameInput ? nameInput.value.trim() || "Anonymous" : "Anonymous",
                author_email: emailInput ? emailInput.value.trim() : "",
                content: contentInput ? contentInput.value.trim() : "",
                post_id: postId,
                likes: 0,
                created_at: new Date().toISOString(),
                status: "published"
            });

            if (result.isOk) {
                form.reset();
                if (note) {
                    feedback(note, document.body.classList.contains("russian") ? "Комментарий опубликован." : "Your comment has been published.");
                }
                form.style.display = 'none';
                form.classList.remove('open');
            } else {
                if (button) button.disabled = false;
                if (note) {
                    feedback(note, document.body.classList.contains("russian") ? "Не удалось сохранить комментарий." : "Unable to save your comment.");
                }
            }
        });
    });

    // =============================================
    // CONTACT FORM
    // =============================================
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", async event => {
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
                if (status) {
                    feedback(status, document.body.classList.contains("russian") ? "Спасибо. Ваше сообщение отправлено." : "Thank you. Your message has been received.");
                }
            } else {
                buttons.forEach(b => b.disabled = false);
                if (status) {
                    feedback(status, document.body.classList.contains("russian") ? "Не удалось отправить сообщение." : "Unable to send your message.");
                }
            }
        });
    }

    // =============================================
    // SCROLL TO TOP
    // =============================================
    const scrollBtn = document.getElementById('scroll-top');
    if (scrollBtn) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                scrollBtn.classList.add('show');
            } else {
                scrollBtn.classList.remove('show');
            }
        });

        scrollBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // =============================================
    // INIT DATA SDK
    // =============================================
    try {
        if (window.dataSdk) {
            const initResult = await window.dataSdk.init({ onDataChanged: renderRecords });
            sdkReady = initResult.isOk;
        } else {
            console.log('Data SDK not available - using localStorage fallback');
        }
    } catch (e) {
        console.log('Data SDK not available - using localStorage fallback');
    }

    console.log('✅ Website loaded successfully!');
    console.log('❤️ Heart buttons are ready!');
});
