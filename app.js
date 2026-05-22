const API_URL = 'http://localhost:5000/api';
let authenticatedUser = null;

// Core Auth Router Configuration Switch
async function handleAuth(action) {
    const usernameInput = document.getElementById('auth-username').value.trim();
    const passwordInput = document.getElementById('auth-password').value.trim();

    if (!usernameInput || !passwordInput) {
        alert("Please enter both username and password parameters.");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });
        const data = await res.json();

        if (res.ok) {
            alert(data.message);
            if (action === 'login') {
                authenticatedUser = data.user;
                
                // Interface View Swap
                document.getElementById('auth-screen').style.display = 'none';
                document.getElementById('app-screen').style.display = 'block';
                
                // Initialize Account Profile Names Elements Layout
                document.getElementById('sidebar-name').innerText = authenticatedUser.username;
                document.getElementById('profile-display-name').innerText = authenticatedUser.username;
                
                loadFeedPosts();
            }
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Backend data pipeline connectivity issue encountered.");
    }
}

// Open Composer Modal for Posting or Editing
function openPostModal(id = null, currentTitle = '', currentContent = '') {
    const titleField = document.getElementById('post-title');
    const contentField = document.getElementById('post-content');
    const idField = document.getElementById('edit-post-id');
    const submitBtn = document.getElementById('submit-post-btn');
    const titleHeader = document.getElementById('modal-title-text');

    if (id) {
        titleHeader.innerText = "Edit your insight";
        idField.value = id;
        titleField.value = currentTitle;
        contentField.value = currentContent;
        submitBtn.innerText = "Save changes";
        submitBtn.onclick = savePostEdit;
    } else {
        titleHeader.innerText = "Create a post";
        idField.value = "";
        titleField.value = "";
        contentField.value = "";
        submitBtn.innerText = "Post";
        submitBtn.onclick = createPost;
    }
    document.getElementById('post-modal').style.display = 'flex';
}

function closePostModal() {
    document.getElementById('post-modal').style.display = 'none';
}

function toggleProfileModal(show) {
    document.getElementById('profile-modal').style.display = show ? 'flex' : 'none';
}

// Post Submission Handler
async function createPost() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if (!title || !content) return;

    try {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        if (res.ok) {
            closePostModal();
            loadFeedPosts();
        }
    } catch (err) {
        alert("Execution runtime error while publishing.");
    }
}

// Save Edited Post Handler
async function savePostEdit() {
    const id = document.getElementById('edit-post-id').value;
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();

    try {
        const res = await fetch(`${API_URL}/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        if (res.ok) {
            closePostModal();
            loadFeedPosts();
        }
    } catch (err) {
        alert("Failed to modify record engine.");
    }
}

// Delete Post Handler
async function deletePost(id) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
        const res = await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadFeedPosts();
        }
    } catch (err) {
        alert("Deletion processing error.");
    }
}

// Dynamic Feed Rendering Engine
async function loadFeedPosts() {
    const container = document.getElementById('posts-container');
    try {
        const res = await fetch(`${API_URL}/posts`);
        const posts = await res.json();
        container.innerHTML = '';

        for (let post of posts) {
            const commRes = await fetch(`${API_URL}/comments/${post.id}`);
            const comments = await commRes.json();
            const commentsHTML = comments.map(c => `
                <div class="comment-item-card">
                    <div class="comment-author"><i class="fa-solid fa-caret-right text-blue"></i> Professional Peer</div>
                    <div>${c.comment_text}</div>
                </div>
            `).join('');

            // Safely handle strings with single quotes for the inline onclick handler
            const safeTitle = post.title.replace(/'/g, "\\'");
            const safeContent = post.content.replace(/'/g, "\\'");

            container.innerHTML += `
                <div class="post-card">
                    <div class="post-header">
                        <div class="author-avatar"><i class="fa-solid fa-user-tie"></i></div>
                        <div>
                            <h4>Network Contributor</h4>
                            <p class="subtitle">Shared Public Insight</p>
                        </div>
                    </div>
                    
                    <div class="post-actions-menu">
                        <button class="action-icon-btn" onclick="openPostModal(${post.id}, '${safeTitle}', '${safeContent}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="action-icon-btn delete-btn" onclick="deletePost(${post.id})">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>

                    <div class="post-body">
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                    </div>

                    <div class="reactions-bar">
                        <button class="react-btn" onclick="alert('Liked!')"><i class="fa-regular fa-thumbs-up"></i> Like</button>
                        <button class="react-btn" onclick="alert('Insightful!')"><i class="fa-regular fa-lightbulb"></i> Insightful</button>
                        <button class="react-btn" onclick="alert('Loved!')"><i class="fa-regular fa-heart"></i> Heart</button>
                    </div>

                    <div class="comments-section-container">
                        <div class="comments-list">${commentsHTML}</div>
                        <div class="post-comment-form-row">
                            <input type="text" id="comm-input-${post.id}" placeholder="Add a comment...">
                            <button class="btn btn-post-comment" onclick="addComment(${post.id})">Post</button>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = `<p style='text-align:center; padding:15px; color:red;'>Feed visualization processing failed.</p>`;
    }
}

// Add Comment Execution Interface
async function addComment(postId) {
    const inputElement = document.getElementById(`comm-input-${postId}`);
    const commentText = inputElement.value.trim();
    if (!commentText) return;

    try {
        const res = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: postId, comment_text: commentText })
        });

        if (res.ok) {
            inputElement.value = '';
            loadFeedPosts();
        }
    } catch (err) {
        alert("Failed to attach discussion element thread.");
    }
}