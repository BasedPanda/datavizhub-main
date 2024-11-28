document.addEventListener('DOMContentLoaded', function() {
    const apiEndpoint = 'https://datavizhub.clowderframework.org/api/datasets/66461b63e4b01d098f2777e6/files'; // test viz hub
    //const apiEndpoint = 'https://datavizhub.clowderframework.org/api/datasets/6557a87be4b08520ac408e92/files'; // Jeff's dataset
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

    const fetchOptions = {
        headers: {
            'X-API-Key': apiKey,
            'accept': '*/*'
        }
    };

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

    async function getFilePreviews(fileId) {
        try {
            const response = await fetch(
                `https://datavizhub.clowderframework.org/api/files/${fileId}/getPreviews`,
                fetchOptions
            );
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return data[0].previews;
        } catch (error) {
            console.error('Error fetching previews:', error);
            return [];
        }
    }

    async function createGalleryItem(item) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
    
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'thumbnail-container';
    
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'spinner';
        thumbnailContainer.appendChild(loadingSpinner);
    
        try {
            const previews = await getFilePreviews(item.id);
            
            const thumbnailPreview = previews.find(p => p.p_id === "Thumbnail");
            const videoPreview = previews.find(p => p.p_id === "Video");
    
            if (item.contentType.startsWith('video/')) {
                if (videoPreview) {
                    const previewVideo = document.createElement('video');
                    previewVideo.className = 'preview-video';
                    previewVideo.src = `https://datavizhub.clowderframework.org${videoPreview.pv_route}?key=${apiKey}`;
                    previewVideo.muted = true;
                    previewVideo.loop = true;
                    previewVideo.playsInline = true;
                    previewVideo.crossOrigin = "anonymous";
                    
                    previewVideo.onerror = () => {
                        console.error(`Failed to load video preview for ${item.filename}`);
                    };
    
                    thumbnailContainer.appendChild(previewVideo);
    
                    galleryItem.addEventListener('mouseenter', () => {
                        previewVideo.style.opacity = '1';
                        previewVideo.play().catch(e => console.log('Preview playback failed:', e));
                    });
    
                    galleryItem.addEventListener('mouseleave', () => {
                        previewVideo.style.opacity = '0';
                        previewVideo.pause();
                        previewVideo.currentTime = 0;
                    });
                }
    
                if (thumbnailPreview) {
                    const thumbnail = document.createElement('img');
                    thumbnail.src = `https://datavizhub.clowderframework.org${thumbnailPreview.pv_route}?key=${apiKey}`;
                    thumbnail.alt = item.filename;
                    thumbnail.className = 'thumbnail';
                    thumbnail.crossOrigin = "anonymous";
                    
                    thumbnail.onerror = () => {
                        console.error(`Failed to load thumbnail for ${item.filename}`);
                        loadingSpinner.style.display = 'none';
                        const errorMessage = document.createElement('div');
                        errorMessage.className = 'item-error';
                        errorMessage.textContent = 'Error loading thumbnail';
                        thumbnailContainer.appendChild(errorMessage);
                    };
    
                    thumbnail.onload = () => {
                        console.log(`Successfully loaded thumbnail for ${item.filename}`);
                        loadingSpinner.style.display = 'none';
                    };
                    
                    thumbnailContainer.appendChild(thumbnail);
                }
            } else if (item.contentType.startsWith('image/')) {
                if (thumbnailPreview) {
                    const thumbnail = document.createElement('img');
                    thumbnail.src = `https://datavizhub.clowderframework.org${thumbnailPreview.pv_route}?key=${apiKey}`;
                    thumbnail.alt = item.filename;
                    thumbnail.className = 'thumbnail';
                    thumbnail.crossOrigin = "anonymous";
                    
                    thumbnail.onerror = () => {
                        console.error(`Failed to load thumbnail for ${item.filename}`);
                        loadingSpinner.style.display = 'none';
                        const errorMessage = document.createElement('div');
                        errorMessage.className = 'item-error';
                        errorMessage.textContent = 'Error loading thumbnail';
                        thumbnailContainer.appendChild(errorMessage);
                    };
    
                    thumbnail.onload = () => {
                        console.log(`Successfully loaded thumbnail for ${item.filename}`);
                        loadingSpinner.style.display = 'none';
                    };
                    
                    thumbnailContainer.appendChild(thumbnail);
                }
            }
    
            const title = document.createElement('h3');
            title.textContent = item.filename;
    
            const addToCartBtn = document.createElement('button');
            addToCartBtn.className = 'cart-btn';
            addToCartBtn.textContent = cart.includes(item.id) ? 'Remove from Cart' : 'Add to Cart';
            addToCartBtn.dataset.id = item.id;
            if (cart.includes(item.id)) addToCartBtn.classList.add('in-cart');
    
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
                
                if (item.contentType.startsWith('video/')) {
                    modalVideo.style.display = 'block';
                    modalVideo.setAttribute('controlsList', 'nodownload');
                    modalVideo.oncontextmenu = function(e) { 
                        e.preventDefault(); 
                        return false; 
                    };
                    modalVideo.controls = true;
                    modalVideo.playsInline = true;
                    
                    if (videoPreview) {
                        modalVideo.src = `https://datavizhub.clowderframework.org${videoPreview.pv_route}?key=${apiKey}`;
                    }
                    
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
                    
                    if (thumbnailPreview) {
                        modalImage.src = `https://datavizhub.clowderframework.org${thumbnailPreview.pv_route}?key=${apiKey}`;
                    }
                }
            });
    
        } catch (error) {
            console.error('Error creating gallery item:', error);
            loadingSpinner.style.display = 'none';
            const errorMessage = document.createElement('div');
            errorMessage.className = 'item-error';
            errorMessage.textContent = 'Error loading preview';
            thumbnailContainer.appendChild(errorMessage);
        }
    
        return galleryItem;
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
                        cart = cart.filter(cartId => cartId !== id);
                        itemEl.remove();
                        updateCartButton();
                        
                        const cartBtn = document.querySelector(`.cart-btn[data-id="${id}"]`);
                        if (cartBtn) {
                            cartBtn.textContent = 'Add to Cart';
                            cartBtn.classList.remove('in-cart');
                        }
                        
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

    // async function fetchData() {
    //     loadingIndicator.style.display = 'block';
    //     errorMessage.style.display = 'none';

    //     try {
    //         const response = await fetch(apiEndpoint, fetchOptions);
    //         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
    //         videoData = await response.json();
    //         gallery.innerHTML = '';
            
    //         for (const item of videoData) {
    //             const galleryItem = await createGalleryItem(item);
    //             gallery.appendChild(galleryItem);
    //         }
    //     } catch (error) {
    //         console.error('Error:', error);
    //         errorMessage.textContent = error.message;
    //         errorMessage.style.display = 'block';
    //     } finally {
    //         loadingIndicator.style.display = 'none';
    //     }
    // }

    async function fetchData() {
        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';
    
        try {
            const response = await fetch(apiEndpoint, fetchOptions);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            videoData = await response.json();
            gallery.innerHTML = '';
            
            // Create all gallery items in parallel
            const galleryItems = await Promise.all(
                videoData.map(item => createGalleryItem(item))
            );
            
            // Add all items to the gallery
            galleryItems.forEach(item => gallery.appendChild(item));
            
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
        }
    });

    fetchData();
});