document.getElementById('upload-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData();
    const photoInput = document.getElementById('photo-input');
    formData.append('photo', photoInput.files[0]);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            addPhotoToGallery(data.photoUrl, data.photoId);
        }
    })
    .catch(error => console.error('Error:', error));
});

function addPhotoToGallery(photoUrl, photoId) {
    const photoGallery = document.getElementById('photo-gallery');
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.innerHTML = `
        <img src="${photoUrl}" alt="Uploaded Photo" data-id="${photoId}">
        <div class="overlay">Click to comment and like</div>
    `;
    photoGallery.appendChild(photoItem);

    photoItem.addEventListener('click', function() {
        openModal(photoUrl, photoId);
    });
}

function openModal(photoUrl, photoId) {
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    modalImage.src = photoUrl;

    fetch(`/photo/${photoId}`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('comments-section').innerHTML = data.comments.map(comment => `<p>${comment}</p>`).join('');
        document.getElementById('like-count').innerText = data.likes;
    });

    modal.style.display = 'flex';

    document.getElementById('comment-button').onclick = function() {
        const commentInput = document.getElementById('comment-input');
        const comment = commentInput.value;
        fetch(`/photo/${photoId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const commentsSection = document.getElementById('comments-section');
                commentsSection.innerHTML += `<p>${comment}</p>`;
                commentInput.value = '';
            }
        });
    };

    document.getElementById('like-button').onclick = function() {
        fetch(`/photo/${photoId}/like`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const likeCount = document.getElementById('like-count');
                likeCount.innerText = parseInt(likeCount.innerText) + 1;
            }
        });
    };

    document.getElementById('close-modal').onclick = function() {
        modal.style.display = 'none';
    };
}
