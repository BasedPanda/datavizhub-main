document.addEventListener('DOMContentLoaded', function() {
    const apiEndpoint = 'https://datavizhub.clowderframework.org/api/datasets/66461b63e4b01d098f2777e6/files';
    const apiKey = '21335e14-10d2-4b97-8cdf-e661a4a7eee8';
    const googleFormUrl = 'YOUR_GOOGLE_FORM_URL_HERE'; // Replace with your Google Form URL
    const videoTitleFieldId = 'entry.XXXXX'; // Replace with your Google Form field ID

    const gallery = document.getElementById('video-gallery');
    const searchInput = document.getElementById('search-input');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    const cartModal = document.getElementById('cart-modal');
    const cartButton = document.getElementById('cart-button');
    const cartItems = document.getElementById('cart-items');
    const proceedToForm = document.getElementById('proceed-to-form');

    let cart = [];
    let videoData = [];

    function updateCartButton() {
        cartButton.textContent = `Cart (${cart.length})`;
    }

    function createGalleryItem(item) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        const fileId = item.id;
        const fileUrl = `https://datavizhub.clowderframework.org/api/files/${fileId}/blob?key=${apiKey}`;
        
        // Create thumbnail container
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'thumbnail-container';

        if (item.contentType.startsWith('video/')) {
            // Create video thumbnail
            const video = document.createElement('video');
            video.src = fileUrl;
            video.muted = true;
            video.crossOrigin = "anonymous";
            video.preload = 'metadata';

            video.addEventListener('loadeddata', () => {
                video.currentTime = video.duration / 2;
            });

            video.addEventListener('seeked', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const thumbnail = document.createElement('img');
                thumbnail.src = canvas.toDataURL('image/jpeg');
                thumbnail.alt = item.filename;
                thumbnailContainer.appendChild(thumbnail);
                video.remove();
            });
        }

        // Create title
        const title = document.createElement('h3');
        title.textContent = item.filename;

        // Create add to cart button
        const addToCartBtn = document.createElement('button');
        addToCartBtn.className = 'cart-btn';
        addToCartBtn.textContent = 'Add to Cart';
        
        if (cart.includes(item.id)) {
            addToCartBtn.classList.add('in-cart');
            addToCartBtn.textContent = 'Remove from Cart';
        }

        addToCartBtn.onclick = (e) => {
            e.stopPropagation();
            if (!cart.includes(item.id)) {
                cart.push(item.id);
                addToCartBtn.textContent = 'Remove from Cart';
                addToCartBtn.classList.add('in-cart');
            } else {
                cart = cart.filter(id => id !== item.id);
                addToCartBtn.textContent = 'Add to Cart';
                addToCartBtn.classList.remove('in-cart');
            }
            updateCartButton();
        };

        galleryItem.appendChild(thumbnailContainer);
        galleryItem.appendChild(title);
        galleryItem.appendChild(addToCartBtn);

        // Add click handler for video playback
        galleryItem.addEventListener('click', () => {
            if (item.contentType.startsWith('video/')) {
                modal.style.display = 'block';
                modalVideo.src = fileUrl;
                modalVideo.setAttribute('quality', '720');
                document.getElementById('video-title').textContent = item.filename;
            }
        });

        return galleryItem;
    }

    function fetchData() {
        loadingIndicator.style.display = 'block';
        fetch(apiEndpoint, {
            headers: {
                'X-API-Key': apiKey
            }
        })
        .then(response => {
            loadingIndicator.style.display = 'none';
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            videoData = data;
            gallery.innerHTML = '';
            data.forEach(item => {
                gallery.appendChild(createGalleryItem(item));
            });
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        });
    }

    // Cart functionality
    cartButton.onclick = () => {
        cartItems.innerHTML = '';
        if (cart.length === 0) {
            cartItems.innerHTML = '<p>Your cart is empty</p>';
            proceedToForm.style.display = 'none';
        } else {
            cart.forEach(id => {
                const item = videoData.find(v => v.id === id);
                if (item) {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'cart-item';
                    itemEl.innerHTML = `
                        <span>${item.filename}</span>
                        <button onclick="this.parentElement.remove();cart=cart.filter(i=>i!=='${id}');updateCartButton();">Remove</button>
                    `;
                    cartItems.appendChild(itemEl);
                }
            });
            proceedToForm.style.display = 'block';
        }
        cartModal.style.display = 'block';
    };

    // Proceed to Google Form
    proceedToForm.onclick = () => {
        const videoTitles = cart.map(id => {
            const item = videoData.find(v => v.id === id);
            return item ? item.filename : '';
        }).join(', ');

        const formUrl = `${googleFormUrl}?${videoTitleFieldId}=${encodeURIComponent(videoTitles)}`;
        window.open(formUrl, '_blank');
    };

    // Modal close handlers
    document.querySelectorAll('.close, .close-cart').forEach(closeBtn => {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            cartModal.style.display = 'none';
            modalVideo.pause();
        };
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const items = document.querySelectorAll('.gallery-item');
        items.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            item.style.display = title.includes(query) ? 'block' : 'none';
        });
    });

    fetchData();
});