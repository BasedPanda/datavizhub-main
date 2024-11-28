document.addEventListener('DOMContentLoaded', function() {
    const apiEndpoint = 'https://datavizhub.clowderframework.org/api/datasets/66461b63e4b01d098f2777e6/files'; // test viz hub
    //const apiEndpoint = 'https://datavizhub.clowderframework.org/api/datasets/6557a87be4b08520ac408e92/files'; // Jeff's AVL dataset
    const apiKey = '21335e14-10d2-4b97-8cdf-e661a4a7eee8';
    const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScNi9NpdsSJcEnBvK37ZHSnxC7ocZ2XxNZjkYtoxHWyigsb-A/viewform';
    
    const FORM_FIELDS = {
        videoTitles: 'entry.1000023',
        requestor: 'entry.1000020',
        email: 'entry.1000025',
        phone: 'entry.1000022'
    };

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
    const logo = document.querySelector('.logo');

    let cart = [];
    let videoData = [];
    const videoCache = new Map(); // Cache for video thumbnails

    // Lazy loading observer
    const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = entry.target;
                const item = videoData.find(i => i.id === container.dataset.itemId);
                if (item) {
                    loadThumbnail(item, container);
                    observer.unobserve(container);
                }
            }
        });
    });

    logo.addEventListener('click', () => {
        searchInput.value = '';
        const items = document.querySelectorAll('.gallery-item');
        items.forEach(item => {
            item.style.display = 'block';
        });
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        fetchData();
    });

    function updateCartButton() {
        cartButton.textContent = `Cart (${cart.length})`;
    }

    function loadThumbnail(item, container) {
        const fileId = item.id;
        const fileUrl = `https://datavizhub.clowderframework.org/api/files/${fileId}/blob?key=${apiKey}`;
        const loadingSpinner = container.querySelector('.spinner');

        if (item.contentType.startsWith('video/')) {
            // Check cache first
            if (videoCache.has(fileId)) {
                const thumbnail = document.createElement('img');
                thumbnail.src = videoCache.get(fileId);
                thumbnail.alt = item.filename;
                thumbnail.className = 'thumbnail';
                container.appendChild(thumbnail);
                loadingSpinner.style.display = 'none';
                setupVideoPreview(container, fileUrl);
                return;
            }

            const video = document.createElement('video');
            video.src = fileUrl;
            video.muted = true;
            video.crossOrigin = "anonymous";
            video.preload = 'metadata';

            video.addEventListener('loadedmetadata', () => {
                video.currentTime = video.duration / 2;
            }, { once: true });

            video.addEventListener('seeked', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const thumbnailUrl = canvas.toDataURL('image/jpeg');
                videoCache.set(fileId, thumbnailUrl); // Cache the thumbnail

                const thumbnail = document.createElement('img');
                thumbnail.src = thumbnailUrl;
                thumbnail.alt = item.filename;
                thumbnail.className = 'thumbnail';
                container.appendChild(thumbnail);
                loadingSpinner.style.display = 'none';
                
                setupVideoPreview(container, fileUrl);
                video.remove();
            }, { once: true });

        } else if (item.contentType.startsWith('image/')) {
            const thumbnail = document.createElement('img');
            thumbnail.src = fileUrl;
            thumbnail.alt = item.filename;
            thumbnail.className = 'thumbnail';
            thumbnail.crossOrigin = "anonymous";
            
            thumbnail.onload = () => {
                loadingSpinner.style.display = 'none';
            };

            thumbnail.onerror = () => {
                loadingSpinner.style.display = 'none';
                thumbnail.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23eee"/><text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em">Image Error</text></svg>';
            };

            container.appendChild(thumbnail);
        }
    }

    function setupVideoPreview(container, fileUrl) {
        const previewVideo = document.createElement('video');
        previewVideo.className = 'preview-video';
        previewVideo.src = fileUrl;
        previewVideo.muted = true;
        previewVideo.loop = true;
        previewVideo.crossOrigin = "anonymous";
        previewVideo.playsInline = true;
        previewVideo.preload = 'metadata';
        container.appendChild(previewVideo);
    }

    function createGalleryItem(item) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'thumbnail-container';
        thumbnailContainer.dataset.itemId = item.id;

        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'spinner';
        thumbnailContainer.appendChild(loadingSpinner);

        if (item.contentType.startsWith('video/')) {
            galleryItem.addEventListener('mouseenter', () => {
                const previewVideo = thumbnailContainer.querySelector('.preview-video');
                if (previewVideo) {
                    previewVideo.play().catch(e => console.log('Preview playback failed:', e));
                }
            });

            galleryItem.addEventListener('mouseleave', () => {
                const previewVideo = thumbnailContainer.querySelector('.preview-video');
                if (previewVideo) {
                    previewVideo.pause();
                    previewVideo.currentTime = 0;
                }
            });
        }

        const title = document.createElement('h3');
        title.textContent = item.filename;

        const addToCartBtn = document.createElement('button');
        addToCartBtn.className = 'cart-btn';
        addToCartBtn.textContent = 'Add to Cart';
        addToCartBtn.dataset.id = item.id;
        
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

        galleryItem.addEventListener('click', () => {
            modal.style.display = 'block';
            document.getElementById('video-title').textContent = item.filename;
            
            const fileUrl = `https://datavizhub.clowderframework.org/api/files/${item.id}/blob?key=${apiKey}`;
            
            if (item.contentType.startsWith('video/')) {
                modalVideo.style.display = 'block';
                modalVideo.setAttribute('controlsList', 'nodownload');
                modalVideo.oncontextmenu = function(e) { 
                    e.preventDefault(); 
                    return false; 
                };
                modalVideo.controls = true;
                modalVideo.playsInline = true;
                modalVideo.style.pointerEvents = 'auto';
                modalVideo.src = fileUrl;
                modalVideo.play().catch(e => console.log('Modal playback failed:', e));
                document.querySelector('.modal-image')?.remove();
            } else if (item.contentType.startsWith('image/')) {
                modalVideo.style.display = 'none';
                let modalImage = document.querySelector('.modal-image');
                
                if (!modalImage) {
                    modalImage = document.createElement('img');
                    modalImage.className = 'modal-image';
                    modalImage.oncontextmenu = function(e) { 
                        e.preventDefault(); 
                        return false; 
                    };
                    modalVideo.parentNode.insertBefore(modalImage, modalVideo);
                }
                modalImage.src = fileUrl;
            }
        });

        // Observe for lazy loading
        lazyLoadObserver.observe(thumbnailContainer);

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
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = item.filename;
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = 'Remove';
                    
                    removeBtn.addEventListener('click', () => {
                        // Remove from cart array
                        cart = cart.filter(cartId => cartId !== id);
                        
                        // Remove from display
                        itemEl.remove();
                        
                        // Update cart button count
                        updateCartButton();
                        
                        // Update "Add to Cart" button in gallery
                        const cartBtn = document.querySelector(`.cart-btn[data-id="${id}"]`);
                        if (cartBtn) {
                            cartBtn.textContent = 'Add to Cart';
                            cartBtn.classList.remove('in-cart');
                        }
                        
                        // If cart is empty, show empty message and hide proceed button
                        if (cart.length === 0) {
                            cartItems.innerHTML = '<p>Your cart is empty</p>';
                            proceedToForm.style.display = 'none';
                        }
                    });
                    
                    itemEl.appendChild(nameSpan);
                    itemEl.appendChild(removeBtn);
                    cartItems.appendChild(itemEl);
                }
            });
            proceedToForm.style.display = 'block';
        }
        cartModal.style.display = 'block';
    };

    proceedToForm.onclick = () => {
        const videoTitles = cart.map(id => {
            const item = videoData.find(v => v.id === id);
            return item ? item.filename.trim() : '';
        }).filter(title => title).join(', ');
    
        let formUrl = googleFormUrl + '?';
        formUrl += `${FORM_FIELDS.videoTitles}=${encodeURIComponent(videoTitles)}`;
        
        window.open(formUrl, '_blank');
    };

    document.querySelectorAll('.close, .close-cart').forEach(closeBtn => {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            cartModal.style.display = 'none';
            modalVideo.pause();
            modalVideo.currentTime = 0;
        };
    });

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            modalVideo.pause();
            modalVideo.currentTime = 0;
        } else if (event.target == cartModal) {
            cartModal.style.display = 'none';
        }
    };

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const items = document.querySelectorAll('.gallery-item');
        items.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            item.style.display = title.includes(query) ? 'block' : 'none';
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
        }
    });

    fetchData();
});