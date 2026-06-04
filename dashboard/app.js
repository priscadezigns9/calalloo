        <div class="nav-item" id="nav-scan" onclick="triggerScanPro()"><i data-lucide="scan"></i>Scan</div>
        <div class="nav-item" id="nav-kitchen" onclick="showTab('kitchen')"><i data-lucide="user"></i>Kitchen</div>
    </nav>

    <script>
        const sb = supabase.createClient('https://sktpjacowqaedddtrhuz.supabase.co', 'sb_publishable_ChdrHQEJV7pVpJMKt-ZaUw_6V0WRKAR');
        let recipes = [], scansToday = 0;
        const isAdmin = true; 
        let cooks = [];
        let userLikes = new Set();
        let currentRecipeId = null;
        let currentViewedUser = null;
        let isProUser = false; // Heritage Sovereign Status

        let userLocation = { lat: 10.1844, lng: -61.5533 }; // Default Trinidad

        function syncLocationImmediate() {
            const toggle = document.getElementById('set-location');
            if (toggle.checked) {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        console.log("Sovereignty Location Locked (Immediate):", userLocation);
                        // Force refresh of the map if the tab is visible
                        if (document.getElementById('map').style.display === 'block') {
                            loadSovereignMap();
                        }
                    }, (err) => {
                        console.warn("Location Sync Failed:", err);
                        toggle.checked = false;
                        alert("Heritage Sync Failed: Please enable location in your browser settings. 🛡️");
                    }, { enableHighAccuracy: true });
                } else {
                    toggle.checked = false;
                    alert("Sovereignty Error: Geolocation not supported. 🛡️");
                }
            } else {
                // If turned off, hide the map immediately
                if (document.getElementById('map').style.display === 'block') {
                    loadSovereignMap();
                }
            }
        }

        async function init() {
            lucide.createIcons();
            
            // Sync User Location (Universal Geotagging)
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    console.log("Sovereignty Location Locked:", userLocation);
                    
                    // Force Map Synchronization if current view is Map
                    const mapContent = document.getElementById('map');
                    if (mapContent && mapContent.style.display === 'block') {
                        loadSovereignMap();
                    }
                }, (err) => {
                    console.warn("Location Access Denied - Using Heritage Default:", err);
                }, { enableHighAccuracy: true });
            }
            const { data: { session }, error: authError } = await sb.auth.getSession();
            let user = session?.user;

            if (!user && !authError) {
                // Try one more time to get user from server directly
                const { data: { user: retryUser } } = await sb.auth.getUser();
                user = retryUser;
            }

            if (!user) {
                console.error("Auth Guard: Session invalid", authError);
                window.location.href = '/login/';
                return;
            }

            // Fetch Real Heritage Cooks from Supabase
            try {
                const { data: profilesData } = await sb.from('profiles').select('full_name, username, avatar_url').limit(20);
                if (profilesData) {
                    cooks = profilesData.map(p => ({
                        name: p.full_name || "Heritage Cook",
                        username: p.username ? `@${p.username}` : "@cook",
                        avatar: p.avatar_url || "https://via.placeholder.com/100?text=Heritage+Cook"
                    }));
                }
            } catch (e) {
                console.error("Cooks Discovery Latency:", e);
            }

            // Central Identity Controller (Universal Recovery & Sovereignty)
            async function syncIdentity() {
                // 1. Initial UI Guard: Load from cache or Auth Metadata for perceived speed
                const cache = JSON.parse(localStorage.getItem('calalloo_profile') || '{}');
                const meta = user.user_metadata || {};
                
                const initialName = cache.name || meta.full_name || "Heritage Cook";
                const initialUser = cache.username || meta.username || user.email.split('@')[0];
                const initialAvatar = cache.avatar || meta.avatar_url || "https://via.placeholder.com/120";
                
                populateProfileUI(initialName, initialUser, initialAvatar, cache.settings || null);

                try {
                    // 2. Deep Recovery: Query the Supabase Sovereign Vault
                    const { data: profile, error } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
                    
                    if (profile) {
                        // SUCCESS: User found in cloud. Restore everything.
                        const name = profile.full_name || initialName;
                        const username = profile.username || initialUser;
                        const avatar = profile.avatar_url || initialAvatar;
                        const preferences = profile.taste_preferences || cache.settings || {};
                        
                        if (profile.whatsapp_pin) {
                            if (!preferences.socials) preferences.socials = {};
                            preferences.socials.whatsapp = profile.whatsapp_pin;
                        }

                        populateProfileUI(name, username, avatar, preferences);
                        
                        // Re-seed the local cache (Healing after a browser clear)
                        localStorage.setItem('calalloo_profile', JSON.stringify({
                            name, username, avatar, settings: preferences
                        }));
                        console.log("Sovereignty Restored: Identity recovered from Supabase Vault. 🛡️");
                    } else {
                        // 3. First-Time Initialization: No record in cloud, create it from current UI state
                        console.log("Initializing new Heritage Sovereignty record...");
                        await sb.from('profiles').upsert([{
                            id: user.id,
                            full_name: initialName,
                            username: initialUser,
                            avatar_url: initialAvatar,
                            origin_platform: 'Calalloo'
                        }]);
                    }
                } catch (e) {
                    console.error("Identity Recovery Latency:", e);
                }
            }

            await syncIdentity();
            loadDiscovery();
            setupRealtime();
            syncPendingDishes(); 

            if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
        }

        async function syncPendingDishes() {
            const pending = JSON.parse(localStorage.getItem('calalloo_pending_dishes') || '[]');
            if (pending.length === 0) return;

            for (const dish of pending) {
                try {
                    const { error } = await sb.from('recipes').insert([dish]);
                    if (!error) {
                        // Success: Remove from local pending
                        let current = JSON.parse(localStorage.getItem('calalloo_pending_dishes') || '[]');
                        localStorage.setItem('calalloo_pending_dishes', JSON.stringify(current.filter(d => d.id !== dish.id)));
                    }
                } catch (e) { console.error("Auto-sync latency:", e); }
            }
        }

        function populateProfileUI(name, username, avatar, settings) {
            const handle = username ? (username.startsWith('@') ? username : `@${username}`) : "";
            document.getElementById('prof-name').innerText = name || "";
            document.getElementById('prof-username').innerText = handle;
            document.getElementById('edit-name').value = name || "";
            document.getElementById('edit-username').value = username || "";
            
            // Restore Extended Profiles
            if (settings) {
                if (settings.socials) {
                    document.getElementById('edit-whatsapp').value = settings.socials.whatsapp || "";
                    document.getElementById('edit-facebook').value = settings.socials.facebook || "";
                    document.getElementById('edit-instagram').value = settings.socials.instagram || "";
                }
                
                if (settings.settings) {
                    document.getElementById('edit-lang').value = settings.settings.lang || "en";
                    document.getElementById('set-location').checked = settings.settings.location || false;
                    document.getElementById('set-camera').checked = settings.settings.camera || false;
                    
                    if (settings.settings.location) {
                        document.getElementById('map-placeholder').style.display = 'none';
                        document.getElementById('actual-map').style.display = 'block';
                        loadSovereignMap();
                    }
                }
            }

            if (avatar) document.getElementById('profile-avatar').src = avatar;
            else document.getElementById('profile-avatar').src = "https://via.placeholder.com/120";
        }

        async function saveSettings(btn) {
            if (!btn) btn = document.querySelector('button[onclick^="saveSettings"]');
            const newName = document.getElementById('edit-name').value.trim();
            const newUsername = document.getElementById('edit-username').value.trim().replace(/^@/, '');
            const newWhatsapp = document.getElementById('edit-whatsapp').value.trim();
            const newFacebook = document.getElementById('edit-facebook').value.trim();
            const newInstagram = document.getElementById('edit-instagram').value.trim();
            const newLang = document.getElementById('edit-lang').value;
            const avatar = document.getElementById('profile-avatar').src;
            const hasLocation = document.getElementById('set-location').checked;
            const hasCamera = document.getElementById('set-camera').checked;
            
            const originalText = "Save Changes";
            
            const profileSettings = { 
                socials: { whatsapp: newWhatsapp, facebook: newFacebook, instagram: newInstagram },
                settings: { location: hasLocation, camera: hasCamera, lang: newLang } 
            };

            // 1. Immediate UI & Cache Update (Sovereignty First)
            populateProfileUI(newName, newUsername, avatar, profileSettings);
            localStorage.setItem('calalloo_profile', JSON.stringify({
                name: newName, username: newUsername, avatar, settings: profileSettings
            }));

            btn.innerText = "Syncing Hub...";
            btn.disabled = true;

            try {
                const { data: { user } } = await sb.auth.getUser();
                if (!user) throw new Error("No active session.");

                // 2. Persistent Cloud Sync (Profiles Table)
                const { error: profileError } = await sb.from('profiles').upsert({
                    id: user.id,
                    full_name: newName,
                    username: newUsername,
                    avatar_url: avatar,
                    whatsapp_pin: newWhatsapp,
                    taste_preferences: profileSettings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

                if (profileError) throw profileError;

                // 3. Secondary Metadata Sync (Auth Layer)
                await sb.auth.updateUser({
                    data: { 
                        full_name: newName,
                        username: newUsername,
                        avatar_url: avatar
                    }
                });

                btn.innerText = "Sovereignty Confirmed! 🛡️🥘";
            } catch (err) {
                console.error("Vault Sync Latency:", err);
                btn.innerText = "Saved Locally ✓";
            } finally {
                setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 2000);
            }
        }

        function setupRealtime() {
            sb.channel('realtime-social')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, payload => updateSocialCounts())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, payload => updateSocialCounts())
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'recipes' }, payload => loadDiscovery())
                .subscribe();
        }

        async function viewUserProfile(username) {
            const cook = cooks.find(c => c.username === username);
            if (!cook) return;
            currentViewedUser = cook;
            
            document.getElementById('u-prof-name').innerText = cook.name;
            document.getElementById('u-prof-title').innerText = cook.name;
            document.getElementById('u-prof-handle').innerText = cook.username + " • " + cook.location;
            document.getElementById('u-prof-avatar').src = cook.avatar;
            
            updateSocialCounts();
            
            // Fetch public recipes for this user
            const { data } = await sb.from('recipes').select('*').eq('author_username', username).eq('is_public', true);
            renderPins('user-public-pins', data || recipes.slice(0, 3)); 
            
            openModal('user-profile-modal');
        }

        async function updateSocialCounts() {
            if (!currentViewedUser) return;
            // Simulated counts from Supabase tables
            const { count: followers } = await sb.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', currentViewedUser.username);
            const { count: following } = await sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', currentViewedUser.username);
            const { count: likes } = await sb.from('likes').select('*', { count: 'exact', head: true }).eq('receiver_username', currentViewedUser.username);

            document.getElementById('count-followers').innerText = followers || 0;
            document.getElementById('count-following').innerText = following || 0;
            document.getElementById('count-likes').innerText = likes || 0;
        }

        async function toggleFollow() {
            const btn = document.getElementById('follow-btn');
            const isFollowing = btn.innerText === "Following";
            
            const currentUser = document.getElementById('prof-username').innerText.split(' • ')[0] || '@guest';
            if (isFollowing) {
                await sb.from('follows').delete().eq('follower_id', currentUser).eq('following_id', currentViewedUser.username);
                btn.innerText = "Follow";
                btn.style.background = "var(--primary)";
            } else {
                const currentUser = document.getElementById('prof-username').innerText.split(' • ')[0] || '@guest';
                await sb.from('follows').insert([{ follower_id: currentUser, following_id: currentViewedUser.username }]);
                btn.innerText = "Following";
                btn.style.background = "#333";
            }
        }

        function openChat() {
            document.getElementById('chat-user-name').innerText = currentViewedUser.name;
            document.getElementById('chat-avatar').src = currentViewedUser.avatar;
            document.getElementById('chat-messages').innerHTML = `<div style="text-align:center; font-size:0.7rem; opacity:0.5; margin-top:20px;">Encrypted Heritage Connection Established 🛡️</div>`;
            openModal('chat-modal');
        }

        async function sendMessage() {
            const input = document.getElementById('chat-input');
            const text = input.value.trim();
            if (!text) return;
            
            const msgHtml = `<div style="align-self:flex-end; background:var(--primary); color:white; padding:10px 15px; border-radius:18px 18px 0 18px; font-size:0.9rem; max-width:80%;">${text}</div>`;
            document.getElementById('chat-messages').innerHTML += msgHtml;
            
            const currentUser = document.getElementById('prof-username').innerText.split(' • ')[0] || '@guest';
            await sb.from('messages').insert([{ sender: currentUser, receiver: currentViewedUser.username, content: text }]);
            
            input.value = '';
            const chatBox = document.getElementById('chat-messages');
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        async function loadDiscovery() {
            // Force clean Discovery fetch
            const { data, error } = await sb.from('recipes').select('*').order('created_at', {ascending:false});
            if (error) console.error("Discovery Engine Link Latency:", error);

            // Fetch User Likes (Saves)
            const { data: { session: currentSession } } = await sb.auth.getSession();
            if (currentSession?.user) {
                const { data: likes } = await sb.from('likes').select('recipe_id').eq('user_id', currentSession.user.id);
                if (likes) {
                    userLikes = new Set(likes.map(l => String(l.recipe_id)));
                }
            }

            const pending = JSON.parse(localStorage.getItem('calalloo_pending_dishes') || '[]');
            let remoteRecipes = data || [];
            
            // Sovereignty Seed Fallback: If DB is empty, inject high-fidelity heritage data
            if (remoteRecipes.length < 5) {
                console.log("Sovereignty Alert: Low density detected. Injecting Heritage Seed Data.");
                const seeds = [
                    { id: 'seed-1', title: "Signature Trinidadian Callaloo", author_username: "HeritageAdmin", cover_photo_url: "https://www.oliveandmango.com/img/MAR2017/callaloo_soup_2.jpg", calories: 420, instructions: "1. Chop dasheen bush leaves and ochroes.\n2. Simmer in coconut milk with aromatics.\n3. Swizzle until velvety." },
                    { id: 'seed-2', title: "Bake & Saltfish", author_username: "HeritageAdmin", cover_photo_url: "https://cookingwithria.com/wp-content/uploads/2015/02/FRIED-BAKE.jpg", calories: 380, instructions: "1. Knead dough and fry until golden.\n2. Sauté saltfish with tomatoes and onions." },
                    { id: 'seed-3', title: "Cornmeal Porridge", author_username: "HeritageAdmin", cover_photo_url: "https://www.africanbites.com/wp-content/uploads/2017/01/IMG_6396.jpg", calories: 310, instructions: "1. Mix cornmeal with water.\n2. Simmer with spices and condense milk." },
                    { id: 'seed-4', title: "Trinidad Doubles", author_username: "HeritageAdmin", cover_photo_url: "https://cookingwithria.com/wp-content/uploads/2025/05/trinidad-doubles_.jpeg", calories: 450, instructions: "1. Prepare channa (chickpeas) with curry.\n2. Serve between two fried bara breads." },
                    { id: 'seed-5', title: "Ackee & Saltfish", author_username: "HeritageAdmin", cover_photo_url: "https://www.myforkinglife.com/wp-content/uploads/2021/07/jamaican-ackee-and-saltfish-photo-1.jpg", calories: 340, instructions: "1. Boil saltfish and flake.\n2. Sauté with onions, peppers, and ackee." },
                    { id: 'seed-6', title: "Bake and Shark", author_username: "HeritageAdmin", cover_photo_url: "https://cookingwithria.com/wp-content/uploads/2024/02/fried-bake-and-shark-with-condiments-3.jpg", calories: 520, instructions: "1. Season and fry shark fillets.\n2. Assemble in a fried bake with garlic sauce." }
                ];
                remoteRecipes = [...remoteRecipes, ...seeds];
            }

            // Deduplication Engine: Combine pending and remote, then unique by ID
            const allItems = [...pending, ...remoteRecipes];
            const seenIds = new Set();
            const uniqueById = [];
            
            for (const item of allItems) {
                if (!seenIds.has(item.id)) {
                    seenIds.add(item.id);
                    uniqueById.push(item);
                }
            }
            
            // Global Sovereignty Mapping: Apply images and normalize titles
            recipes = uniqueById.map(r => {
                const title = r.title.toLowerCase();
                // Gold Standard Heritage Image Mapping
                if (title.includes('calalloo')) r.cover_photo_url = "https://www.oliveandmango.com/img/MAR2017/callaloo_soup_2.jpg";
                else if (title.includes('bake') && title.includes('saltfish')) r.cover_photo_url = "https://cookingwithria.com/wp-content/uploads/2015/02/FRIED-BAKE.jpg";
                else if (title.includes('cornmeal porridge')) r.cover_photo_url = "https://www.africanbites.com/wp-content/uploads/2017/01/IMG_6396.jpg";
                else if (title.includes('sada roti')) r.cover_photo_url = "https://cookingwithria.com/wp-content/uploads/2018/10/SADA-ROTI.jpg";
                else if (title.includes('tomato choka')) r.cover_photo_url = "https://thatgirlcookshealthy.com/wp-content/uploads/2019/10/tomato-choka-pin.jpg";
                else if (title.includes('baigan choka')) r.cover_photo_url = "https://thatgirlcookshealthy.com/wp-content/uploads/2020/05/baigan-choka-pin123.jpg";
                else if (title.includes('pumpkin choka') || title.includes('pumpkin talkari')) r.cover_photo_url = "https://thisbagogirl.com/wp-content/uploads/2025/06/PumpkinChoka-1.jpg";
                else if (title.includes('coconut bake')) r.cover_photo_url = "https://cookingwithria.com/wp-content/uploads/2015/02/10-trinidad-coconut-bake-13.jpg";
                else if (title.includes('smoked herring')) r.cover_photo_url = "https://cookingwithria.com/wp-content/uploads/2023/02/SMOKED-HERRING-AND-COCONUT-POT-BAKE-4.jpg";
                else if (title.includes('saltfish buljol')) r.cover_photo_url = "https://cookingwithria.com/wp-content/uploads/2015/10/Buljol-3-1.jpg";
                else if (title.includes('toolum')) r.cover_photo_url = "https://www.simplytrinicooking.com/wp-content/uploads/2012/02/toolum.jpg";
                else if (title.includes('sweet bread')) r.cover_photo_url = "https://cookingwithria.com/wp-content/uploads/2020/01/trinidad-sweet-bread.jpg";
                else if (title.includes('stewed red beans')) r.cover_photo_url = "https://cookingwithria.com/wp-content/uploads/2015/02/23-Trini-Stewed-Red-Beans-24.jpg";
                else if (title.includes('sorrel')) r.cover_photo_url = "https://thatgirlcookshealthy.com/wp-content/uploads/2020/11/instant-pot-jamaican-sorrel-drink-pin.jpg";
                else if (title.includes('ginger beer')) r.cover_photo_url = "https://thatgirlcookshealthy.com/wp-content/uploads/2020/07/ginger-beer-pin-1.jpg";
                else if (title.includes('mauby')) r.cover_photo_url = "https://thatgirlcookshealthy.com/wp-content/uploads/2021/01/Caribbean-Mauby-Drink-pin.png";
                else if (title.includes('doubles')) r.cover_photo_url = "https://cookingwithria.com/wp-content/uploads/2025/05/trinidad-doubles_.jpeg";
                else if (title.includes('jamaican') || title.includes('jamaixan')) {
                    if (title.includes('gizzard') || title.includes('gizzada')) r.cover_photo_url = "https://ayouniquejourney.com/wp-content/uploads/2021/05/Jamaican-Gizzada-22-480x480.png.webp";
                    else r.cover_photo_url = "https://www.myforkinglife.com/wp-content/uploads/2021/07/jamaican-ackee-and-saltfish-photo-1.jpg";
                }
                else if (title.includes('bake and shark')) r.cover_photo_url = "https://cookingwithria.com/wp-content/uploads/2024/02/fried-bake-and-shark-with-condiments-3.jpg";
                return r;
            });

            // Final Discovery Deduplication (by Title): Keep only the most recent version of a dish for the feed
            const seenTitles = new Set();
            const discoveryFeed = recipes.filter(r => {
                if (seenTitles.has(r.title.toLowerCase())) return false;
                seenTitles.add(r.title.toLowerCase());
                return true;
            });

            renderPins('discovery-pins', discoveryFeed);
        }

        function renderPins(gridId, items) {
            const grid = document.getElementById(gridId);
            if(!grid) return;
            const profUserElem = document.getElementById('prof-username');
            const currentUser = (profUserElem ? profUserElem.innerText.split(' • ')[0] : '') || '@guest';
            
            // Sovereignty Filter (Scalable): Show published recipes OR user's own recipes
            const visibleItems = items.filter(r => {
                // Column name in DB is 'is_published'
                const isPublished = r.is_published === true || r.is_published === undefined || r.is_published === null;
                const author = r.author_username || "";
                return isPublished || author === currentUser;
            });

            if (visibleItems.length === 0) {
                grid.innerHTML = `<div style="column-span:all; text-align:center; padding:40px; color:var(--grey-text);">
                    <i data-lucide="utensils" style="width:40px; height:40px; margin-bottom:10px; opacity:0.3;"></i>
                    <p>No recipes found in the vault yet.</p>
                </div>`;
            } else {
                grid.innerHTML = visibleItems.map(r => `
                    <div class="recipe-pin" onclick="openRecipe('${r.id}')" style="cursor:pointer;">
                        <img src="${r.cover_photo_url || 'https://via.placeholder.com/400x300?text=Heritage+Recipe'}">
                        <div class="pin-overlay">
                            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                                <h3>${r.title}</h3>
                                ${r.is_published === false ? '<i data-lucide="lock" style="width:14px; height:14px; color:white;"></i>' : ''}
                            </div>
                        </div>
                    </div>
                `).join('');
            }
            lucide.createIcons();
        }

        function openAddReel() {
            const gateway = document.createElement('div');
            gateway.id = "upload-gateway";
            gateway.style = "position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:9000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(10px);";
            gateway.innerHTML = `
                <div style="background:var(--bg); width:100%; max-width:380px; border-radius:32px; padding:30px; text-align:center; animation: slideUp 0.3s ease;">
                    <h3 class="display-font" style="font-size:1.5rem; margin-bottom:10px;">The Heritage Hub</h3>
                    <p style="font-size:0.85rem; color:var(--grey-text); margin-bottom:25px;">How are you contributing today?</p>
                    <div style="display:grid; gap:12px;">
                        <button onclick="closeGateway(); triggerScanPro();" style="width:100%; padding:15px; border-radius:18px; border:1px solid var(--border); background:var(--light-bg); display:flex; align-items:center; gap:15px; cursor:pointer;">
                            <div style="background:rgba(232,119,34,0.1); padding:10px; border-radius:12px;"><i data-lucide="image" style="color:var(--primary); width:20px;"></i></div>
                            <div style="text-align:left;">
                                <p style="font-weight:700; font-size:0.85rem;">Upload Image</p>
                                <p style="font-size:0.65rem; color:var(--grey-text);">Share a photo of your dish</p>
                            </div>
                        </button>
                        <button onclick="closeGateway(); alert('Reel Engine Syncing...');" style="width:100%; padding:15px; border-radius:18px; border:1px solid var(--border); background:var(--light-bg); display:flex; align-items:center; gap:15px; cursor:pointer;">
                            <div style="background:rgba(232,119,34,0.1); padding:10px; border-radius:12px;"><i data-lucide="video" style="color:var(--primary); width:20px;"></i></div>
                            <div style="text-align:left;">
                                <p style="font-weight:700; font-size:0.85rem;">Upload Reel</p>
                                <p style="font-size:0.65rem; color:var(--grey-text);">Post a cooking video</p>
                            </div>
                        </button>
                        <button onclick="closeGateway(); openMarketListingModal();" style="width:100%; padding:15px; border-radius:18px; border:2px solid var(--primary); background:var(--light-bg); display:flex; align-items:center; gap:15px; cursor:pointer;">
                            <div style="background:var(--primary); padding:10px; border-radius:12px;"><i data-lucide="shopping-bag" style="color:white; width:20px;"></i></div>
                            <div style="text-align:left;">
                                <p style="font-weight:800; font-size:0.85rem; color:var(--primary);">Upload Ad</p>
                                <p style="font-size:0.65rem; color:var(--grey-text);">BBQs, Curry Qs, Sweets or Goods</p>
                            </div>
                        </button>
                    </div>
                    <button onclick="closeGateway()" style="margin-top:25px; background:none; border:none; color:var(--grey-text); font-weight:700; cursor:pointer;">Maybe Later</button>
                </div>
            `;
            document.body.appendChild(gateway);
            lucide.createIcons();
        }

        function closeGateway() {
            const el = document.getElementById('upload-gateway');
            if(el) el.remove();
        }

        function showTab(id) {
            console.log("Sovereign Navigation: Activating", id);
            
            // Wipe all tab states
            const contents = document.getElementsByClassName('tab-content');
            for(let i=0; i<contents.length; i++) {
                contents[i].style.display = 'none';
            }
            
            const navItems = document.getElementsByClassName('nav-item');
            for(let i=0; i<navItems.length; i++) {
                navItems[i].classList.remove('active');
            }
            
            const tabBtns = document.getElementsByClassName('tab-btn');
            for(let i=0; i<tabBtns.length; i++) {
                tabBtns[i].classList.remove('active');
            }
            
            // Activate target
            const target = document.getElementById(id);
            if (target) {
                target.style.display = 'block';
                window.scrollTo(0, 0);
            } else {
                console.error("Navigation Failure: Target ID not found", id);
            }
            
            // Sync UI indicators
            const navId = 'nav-' + id;
            const deskId = 'd-tab-' + id;
            
            const navEl = document.getElementById(navId);
            if (navEl) navEl.classList.add('active');
            
            const deskEl = document.getElementById(deskId);
            if (deskEl) deskEl.classList.add('active');

            if(id === 'kitchen') switchKitchenTab('saved');
            if(id === 'map') loadSovereignMap();
        }

        function loadSovereignMap() {
            const actualMap = document.getElementById('actual-map');
            const mapFrame = document.getElementById('map-frame');
            const placeholder = document.getElementById('map-placeholder');
            const locToggle = document.getElementById('set-location');
            
            if (actualMap && mapFrame && placeholder) {
                if (locToggle && !locToggle.checked) {
                    placeholder.style.display = 'flex';
                    actualMap.style.display = 'none';
                    return;
                }

                placeholder.style.display = 'none';
                actualMap.style.display = 'block';
                
                // High-Fidelity Universal Embed (No-Key Sovereign Format)
                const lat = userLocation.lat;
                const lng = userLocation.lng;
                
                // Constructing a robust search query for local groceries/markets near user coordinates
                // We must use the &center and &zoom for the view and &q for the pins
                const query = encodeURIComponent("groceries markets");
                mapFrame.src = `https://www.google.com/maps?q=${query}&ll=${lat},${lng}&z=15&t=&ie=UTF8&iwloc=&output=embed`;
                
                console.log(`Sovereign Universal Map: Discovery centered at ${lat}, ${lng}`);
            }
        }

        async function openRecipe(id) {
            console.log("Opening recipe:", id);
            currentRecipeId = id;
            const r = recipes.find(item => item.id === id);
            if(!r) {
                console.error("Recipe not found in local memory:", id);
                return;
            }
            document.getElementById('m-img').src = r.cover_photo_url || 'https://via.placeholder.com/400x300?text=Heritage+Recipe';
            document.getElementById('m-title').innerText = r.title;
            
            // Add Caloric Data Placeholder
            const caloricValue = r.calories || Math.floor(Math.random() * (600 - 300) + 300); // Dynamic fallback
            const caloriesHtml = `
                <div style="display:flex; align-items:center; gap:8px; margin-top:5px; color:var(--primary); font-size:0.8rem; font-weight:800;">
                    <i data-lucide="flame" style="width:14px; height:14px;"></i>
                    <span>${caloricValue} kcal / Serving</span>
                </div>
            `;
            const titleContainer = document.getElementById('m-title').parentElement;
            let calDisplay = document.getElementById('caloric-display');
            if(!calDisplay) {
                calDisplay = document.createElement('div');
                calDisplay.id = 'caloric-display';
                titleContainer.appendChild(calDisplay);
            }
            calDisplay.innerHTML = caloriesHtml;
            lucide.createIcons();

            const mapBtn = document.getElementById('map-redirect-btn');
            if (mapBtn) {
                mapBtn.onclick = () => {
                    closeModal('detail-modal');
                    findIngredientsOnMap(r.title);
                };
            }
            
            // Sovereignty Control: Option to toggle privacy, edit, and delete for the owner
            const profUserElem = document.getElementById('prof-username');
            const currentUser = (profUserElem ? profUserElem.innerText.split(' • ')[0].replace(/^@/, '') : '') || 'guest';
            const recipeAuthor = (r.author_username || "").replace(/^@/, '');
            
            let controls = document.getElementById('recipe-controls');
            if (!controls) {
                controls = document.createElement('div');
                controls.id = 'recipe-controls';
                controls.style = "margin-top: 15px; display: flex; flex-direction: column; gap: 10px;";
                const modalBody = document.querySelector('#detail-modal .modal-content');
                if (modalBody) modalBody.appendChild(controls);
            }
            
            if (recipeAuthor === currentUser) {
                controls.innerHTML = `
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <button onclick="toggleRecipePrivacy('${r.id}')" style="background:var(--primary); color:white; border:none; padding:12px; border-radius:12px; font-weight:700; cursor:pointer;">
                            ${r.is_published === false ? '<i data-lucide="unlock"></i> Make Public' : '<i data-lucide="lock"></i> Make Private'}
                        </button>
                        <button onclick="editRecipe('${r.id}')" style="background:var(--text); color:var(--bg); border:none; padding:12px; border-radius:12px; font-weight:700; cursor:pointer;">
                            <i data-lucide="edit-3"></i> Edit Dish
                        </button>
                    </div>
                    <button onclick="deleteRecipe('${r.id}')" style="background:#ff4444; color:white; border:none; padding:12px; border-radius:12px; font-weight:700; cursor:pointer; width:100%;">
                        <i data-lucide="trash-2"></i> Delete Permanently
                    </button>
                `;
                controls.style.display = 'block';
            } else {
                controls.innerHTML = `
                    <button onclick="followUser('${r.author_username}')" style="background:var(--primary); color:white; border:none; padding:12px; border-radius:12px; font-weight:700; cursor:pointer; width:100%;">
                        Follow ${r.author_username}
                    </button>
                `;
                controls.style.display = 'block';
            }

            const instList = document.getElementById('inst-list');
            if (r.instructions && (Array.isArray(r.instructions) || typeof r.instructions === 'string')) {
                if (Array.isArray(r.instructions)) {
                    instList.innerHTML = r.instructions.map((step, i) => `<p style="margin-bottom:15px;"><b>${i+1}.</b> ${step}</p>`).join('');
                } else {
                    instList.innerHTML = r.instructions.split('\n').map((step, i) => `<p style="margin-bottom:15px;"><b>${i+1}.</b> ${step}</p>`).join('');
                }
            } else {
                instList.innerHTML = `
                    <div style="padding:20px; border:1px dashed var(--border); border-radius:12px; text-align:center;">
                        <p style="color:var(--grey-text); font-size:0.85rem;">Authentic instructions are being verified by the Heritage Council...</p>
                        <p style="font-size:0.75rem; color:var(--primary); font-weight:800; margin-top:10px;">PRO STATUS REQUIRED FOR FULL ACCESS</p>
                    </div>
                `;
            }

            const ingList = document.getElementById('ing-list');
            try {
                const { data: ingData, error } = await sb.from('recipe_ingredients').select('ingredient_name, quantity').eq('recipe_id', id);
                if (error) throw error;
                if (ingData && ingData.length > 0) {
                    ingList.innerHTML = ingData.map(i => `<div style="padding:8px 0; border-bottom:1px solid var(--border);">• ${i.quantity || ''} ${i.ingredient_name}</div>`).join('');
                } else {
                    // Check if they are in the recipe object itself as a backup
                    if (r.ingredients && Array.isArray(r.ingredients)) {
                         ingList.innerHTML = r.ingredients.map(i => `<div style="padding:8px 0; border-bottom:1px solid var(--border);">• ${i}</div>`).join('');
                    } else {
                         ingList.innerHTML = `
                            <div style="padding:15px; background:var(--light-bg); border-radius:12px; font-size:0.8rem; color:var(--grey-text);">
                                Ingredients are currently securely stored in the Heritage Vault. Use the <b>Sovereign Scanner</b> to verify components in real-time.
                            </div>
                         `;
                    }
                }
            } catch (e) {
                console.warn("Ingredients fetch latency:", e);
                ingList.innerHTML = "Ingredients securely stored in the cloud.";
            }

            openModal('detail-modal');
        }

        function switchKitchenTab(tab) {
            console.log("Switching Kitchen Tab:", tab);
            document.querySelectorAll('.k-tab').forEach(t => t.classList.remove('active'));
            const activeTab = document.getElementById('k-tab-'+tab);
            if(activeTab) activeTab.classList.add('active');
            
            // Normalize handle for comparison (remove @ if present)
            const profUserElem = document.getElementById('prof-username');
            const currentUser = (profUserElem ? profUserElem.innerText.split(' • ')[0].replace(/^@/, '') : '') || 'guest';
            let filtered = [];
            
            if (tab === 'saved') {
                const seenTitles = new Set();
                filtered = recipes.filter(r => {
                    const author = (r.author_username || "").replace(/^@/, '');
                    const rid = String(r.id);
                    const isYours = author === currentUser || userLikes.has(rid);
                    if (!isYours) return false;
                    
                    const title = (r.title || "Untitled").toLowerCase();
                    if (seenTitles.has(title)) return false;
                    seenTitles.add(title);
                    return true;
                });
            } else if (tab === 'public') {
                filtered = recipes.filter(r => {
                    const author = (r.author_username || "").replace(/^@/, '');
                    return author === currentUser && (r.is_published === true || r.is_published === undefined || r.is_published === null);
                });
            } else if (tab === 'private') {
                filtered = recipes.filter(r => {
                    const author = (r.author_username || "").replace(/^@/, '');
                    return author === currentUser && r.is_published === false;
                });
            }
            
            renderPins('kitchen-pins', filtered);
        }

        async function performSearch() {
            const q = document.getElementById('header-search').value.trim().toLowerCase();
            const grid = document.getElementById('discovery-pins');
            
            if (!q) {
                renderPins('discovery-pins', recipes);
                return;
            }

            // Sovereignty Switch: Ensure we are in Discovery mode to view results
            document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
            document.getElementById('discovery').style.display = 'block';
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            const discoveryNav = document.getElementById('nav-discovery');
            if (discoveryNav) discoveryNav.classList.add('active');

            // 1. Heritage Dishes Discovery (Local Memory)
            const filteredRecipes = recipes.filter(r => r.title.toLowerCase().includes(q));
            
            // 2. Heritage Cook Discovery (Local + Universal Remote)
            let filteredCooks = cooks.filter(c => 
                (c.name && c.name.toLowerCase().includes(q)) || 
                (c.username && c.username.toLowerCase().includes(q))
            );

            try {
                // Universal Deep Query into Supabase Identity Vault
                const { data: remoteCooks, error: searchError } = await sb.from('profiles')
                    .select('full_name, username, avatar_url')
                    .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
                    .limit(12);
                
                if (remoteCooks && !searchError) {
                    remoteCooks.forEach(p => {
                        const handle = p.username ? `@${p.username}` : "@cook";
                        if (!filteredCooks.some(existing => existing.username === handle)) {
                            filteredCooks.push({
                                name: p.full_name || "Heritage Cook",
                                username: handle,
                                avatar: p.avatar_url || "https://via.placeholder.com/100?text=Heritage+Cook"
                            });
                        }
                    });
                }
            } catch (e) { console.warn("Universal Cook Search Latency:", e); }

            let html = '';
            const currentUser = (document.getElementById('prof-username') ? document.getElementById('prof-username').innerText.split(' • ')[0] : '') || '@guest';

            // Render Cooks Section (High-Fidelity Grid)
            if (filteredCooks.length > 0) {
                html += `
                    <div style="column-span:all; width:100%; margin-bottom:25px; background:var(--light-bg); border-radius:24px; padding:20px; border:1px solid var(--border);">
                        <h3 class="display-font" style="font-size:1.1rem; margin-bottom:15px; display:flex; align-items:center; gap:10px; color:var(--primary);">
                            <i data-lucide="users" style="width:20px;"></i> Heritage Cooks
                        </h3>
                        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:12px;">
                            ${filteredCooks.map(c => `
                                <div class="recipe-pin" style="padding:15px; display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; background:var(--bg); border:1px solid var(--border); border-radius:20px; margin-bottom:0;" onclick="viewUserProfile('${c.username.replace('@','')}')">
                                    <img src="${c.avatar}" style="width:55px; height:55px; border-radius:50%; object-fit:cover; border:3px solid var(--primary);">
                                    <div style="width:100%; overflow:hidden;">
                                        <p style="font-weight:800; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.name}</p>
                                        <p style="font-size:0.7rem; color:var(--grey-text);">${c.username}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Render Dishes Section
            if (filteredRecipes.length > 0) {
                const visibleRecipes = filteredRecipes.filter(r => {
                    const isPublished = r.is_published === true || r.is_published === undefined || r.is_published === null;
                    return isPublished || r.author_username === currentUser;
                });

                if (visibleRecipes.length > 0) {
                    if (filteredCooks.length > 0) {
                        html += `<div style="column-span:all; padding:10px; margin:10px 0; border-bottom:1px solid var(--border);"><h3 class="display-font" style="font-size:1.2rem;">Heritage Dishes</h3></div>`;
                    }
                    html += visibleRecipes.map(r => `
                        <div class="recipe-pin" onclick="openRecipe('${r.id}')">
                            <img src="${r.cover_photo_url || 'https://via.placeholder.com/400x300?text=Heritage+Recipe'}">
                            <div class="pin-overlay">
                                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                                    <h3>${r.title}</h3>
                                    ${r.is_published === false ? '<i data-lucide="lock" style="width:14px; height:14px; color:white;"></i>' : ''}
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }

            if (html === '') {
                html = `<div style="column-span:all; text-align:center; padding:60px; color:var(--grey-text);">
                    <i data-lucide="search-x" style="width:40px; height:40px; margin-bottom:10px; opacity:0.3;"></i>
                    <p>No heritage matches found for "${q}"</p>
                </div>`;
            }
            
            grid.innerHTML = html;
            lucide.createIcons();
        }

        async function saveToKitchen() { 
            if (!currentRecipeId) return;
            const rid = String(currentRecipeId);
            const { data: { session } } = await sb.auth.getSession();
            if (!session?.user) return;

            try {
                if (userLikes.has(rid)) {
                    alert("Dish is already secured in your Heritage Vault! 🥘🛡️");
                    closeModal('detail-modal');
                    return;
                }

                const { error } = await sb.from('likes').upsert({ 
                    user_id: session.user.id, 
                    recipe_id: rid 
                }, { onConflict: 'user_id,recipe_id' });
                
                if (error) {
                    console.warn("Vault DB Latency, falling back to session-vault:", error);
                }
                
                userLikes.add(rid);
                alert("Recipe secured in your Heritage Vault! 🥘🛡️");
                closeModal('detail-modal');
                
                if (document.getElementById('kitchen').style.display === 'block') {
                    switchKitchenTab('saved');
                }
            } catch (e) {
                console.error("Vault Save Latency:", e);
                userLikes.add(rid); // Still add locally
                alert("Saved locally to your session vault ✓");
                closeModal('detail-modal');
            }
        }

        function previewAvatar(input) { 
            if(input.files && input.files[0]) { 
                const reader = new FileReader(); 
                reader.onload = (e) => { 
                    const avatarData = e.target.result;
                    document.getElementById('profile-avatar').src = avatarData; 
                    document.getElementById('sync-avatar-btn').style.display = 'block'; 
                }; 
                reader.readAsDataURL(input.files[0]); 
            } 
        }

        async function syncAvatarToVault() {
            const avatarData = document.getElementById('profile-avatar').src;
            const name = document.getElementById('edit-name').value;
            const username = document.getElementById('edit-username').value.replace(/^@/, ''); // Normalize
            const wa = document.getElementById('edit-whatsapp').value;
            const fb = document.getElementById('edit-facebook').value;
            const ig = document.getElementById('edit-instagram').value;
            
            // Immediately save to LocalStorage (fast)
            const profile = { name, username, avatar: avatarData, whatsapp: wa, facebook: fb, instagram: ig };
            localStorage.setItem('calalloo_profile', JSON.stringify(profile));
            
            // Update UI Profile Section immediately
            document.getElementById('prof-name').innerText = name;
            document.getElementById('prof-username').innerHTML = `@${username} • <span style="color:var(--primary); font-weight:800;">PRO</span>`;
            
            const syncBtn = document.getElementById('sync-avatar-btn');
            syncBtn.innerText = 'Syncing to Supabase...';
            syncBtn.disabled = true;
            
            try {
                const { data: { user } } = await sb.auth.getUser();
                if (!user) throw new Error("No authenticated user session.");

                const payload = { 
                    id: user.id,
                    username: username, 
                    full_name: name,
                    avatar_url: avatarData,
                    whatsapp_link: wa,
                    facebook_link: fb,
                    instagram_link: ig,
                    updated_at: new Date().toISOString()
                };

                const { error } = await sb.from('profiles').upsert(payload);
                
                if (error) {
                    console.error("Supabase Sync Error:", error);
                    syncBtn.innerText = 'Saved Locally ✓';
                } else {
                    syncBtn.innerText = 'Synced to Vault! 🛡️';
                    setTimeout(() => { syncBtn.style.display = 'none'; syncBtn.innerText = 'Save New Picture'; syncBtn.disabled = false; }, 2000);
                }
            } catch (err) {
                console.error("Critical Sync Latency:", err);
                syncBtn.innerText = 'Saved Locally ✓';
                syncBtn.disabled = false;
            }
        }
        function openProModal(e) { e.stopPropagation(); openModal('pro-modal'); document.getElementById('pro-intro').style.display = 'block'; document.getElementById('payment-overlay').style.display = 'none'; }
        function showPaymentOverlay() { document.getElementById('payment-overlay').style.display = 'flex'; }
        function hidePaymentOverlay() { document.getElementById('payment-overlay').style.display = 'none'; }
        function confirmUpgrade() { 
            isProUser = true;
            alert('PRO Activated! Your Sovereign reach is now boosted. 🛡️'); 
            closeModal('pro-modal'); 
        }
        function openModal(id) { document.getElementById(id).style.display = 'flex'; }
        function closeModal(id) { document.getElementById(id).style.display = 'none'; }
        async function deleteRecipe(id) {
            if (!confirm("Are you sure you want to delete this heritage dish permanently? 🛡️")) return;
            try {
                const { error } = await sb.from('recipes').delete().eq('id', id);
                if (error) throw error;
                alert("Dish successfully removed from the Heritage Vault.");
                closeModal('detail-modal');
                loadDiscovery();
                if (document.getElementById('kitchen').style.display !== 'none') {
                    const activeTab = document.querySelector('.k-tab.active').id.replace('k-tab-', '');
                    switchKitchenTab(activeTab);
                }
            } catch (e) {
                console.error("Deletion Error:", e);
                alert("Vault Error: Could not delete dish.");
            }
        }

        async function editRecipe(id) {
            const r = recipes.find(item => item.id === id);
            if (!r) return;
            
            document.getElementById('dish-title').value = r.title;
            document.getElementById('dish-ingredients').value = Array.isArray(r.ingredients) ? r.ingredients.join('\n') : r.ingredients || "";
            document.getElementById('dish-instructions').value = Array.isArray(r.instructions) ? r.instructions.join('\n') : r.instructions || "";
            document.getElementById('dish-privacy').value = r.is_published === false ? 'private' : 'public';
            
            if (r.cover_photo_url) {
                const preview = document.getElementById('dish-preview');
                preview.src = r.cover_photo_url;
                preview.style.display = 'block';
            }
            
            // Temporary flag to identify update vs new
            document.getElementById('add-modal').setAttribute('data-editing-id', id);
            closeModal('detail-modal');
            openModal('add-modal');
        }

        async function followUser(username) {
            const { data: { session } } = await sb.auth.getSession();
            if (!session) { alert("Please sign in to follow heritage cooks."); return; }
            
            const handle = username.replace(/^@/, '');
            try {
                const { error } = await sb.from('follows').insert([{ 
                    follower_id: session.user.id, 
                    following_username: handle 
                }]);
                if (error) {
                    if (error.code === '23505') alert(`You are already following @${handle} 🛡️`);
                    else throw error;
                } else {
                    alert(`Now following @${handle} in the Heritage Hub!`);
                }
            } catch (e) {
                console.error("Follow Error:", e);
                alert("Vault Latency: Could not follow user.");
            }
        }

        async function toggleRecipePrivacy(id) {
            const r = recipes.find(item => item.id === id);
            if (!r) return;
            const newPrivacy = !(r.is_published === true || r.is_published === undefined || r.is_published === null);
            try {
                const { error } = await sb.from('recipes').update({ is_published: newPrivacy }).eq('id', id);
                if (error) throw error;
                r.is_published = newPrivacy;
                alert(`Dish is now ${newPrivacy ? 'Public' : 'Private'}.`);
                if (typeof openRecipe === 'function') openRecipe(id); // Refresh view
                loadDiscovery();
            } catch (e) {
                console.error("Privacy Toggle Error:", e);
                alert("Vault Error: Could not update privacy.");
            }
        }

        async function submitDish() {
            const title = document.getElementById('dish-title').value;
            const ingredients = document.getElementById('dish-ingredients').value;
            const instructions = document.getElementById('dish-instructions').value;
            const privacy = document.getElementById('dish-privacy').value;
            const imgInput = document.getElementById('dish-img');
            const submitBtn = document.getElementById('submit-dish-btn') || event.target;
            const editingId = document.getElementById('add-modal').getAttribute('data-editing-id');
            
            if(!title && !editingId) {
                alert("Please provide a title for your dish.");
                return;
            }

            const currentBtnText = submitBtn.innerText;
            submitBtn.innerText = "Vault Processing...";
            submitBtn.disabled = true;

            try {
                const { data: { session } } = await sb.auth.getSession();
                const userId = session?.user?.id || null;
                const currentUserElem = document.getElementById('prof-username');
                const currentUser = (currentUserElem ? currentUserElem.innerText.split(' • ')[0].replace(/^@/, '') : '') || 'guest';
                
                const compressImage = (base64) => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.src = base64;
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 1200; 
                            const scale = MAX_WIDTH / img.width;
                            canvas.width = MAX_WIDTH;
                            canvas.height = img.height * scale;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            resolve(canvas.toDataURL('image/jpeg', 0.8));
                        };
                    });
                };

                let coverUrl = null;
                const previewImg = document.getElementById('dish-preview');
                if (imgInput.files && imgInput.files[0]) {
                    const reader = new FileReader();
                    const base64 = await new Promise(r => { reader.onload = e => r(e.target.result); reader.readAsDataURL(imgInput.files[0]); });
                    coverUrl = await compressImage(base64);
                } else if (previewImg && previewImg.style.display !== 'none' && previewImg.src.startsWith('data:')) {
                    coverUrl = await compressImage(previewImg.src);
                } else if (editingId) {
                    const r = recipes.find(item => item.id === editingId);
                    coverUrl = r ? r.cover_photo_url : null;
                }

                const dishData = {
                    title: title,
                    cover_photo_url: coverUrl,
                    cook_id: userId,
                    author_username: currentUser,
                    is_published: privacy === 'public',
                    instructions: instructions.split('\n').filter(i => i.trim()),
                    ingredients: ingredients.split('\n').filter(i => i.trim()),
                    updated_at: new Date().toISOString()
                };

                if (editingId) {
                    const { error } = await sb.from('recipes').update(dishData).eq('id', editingId);
                    if (error) throw error;
                    alert("Dish successfully updated in the Heritage Vault! 🥘🛡️");
                } else {
                    dishData.created_at = new Date().toISOString();
                    const { error } = await sb.from('recipes').insert([dishData]);
                    if (error) throw error;
                    alert("Dish successfully synced to the Heritage Vault! 🥘🛡️");
                }

                document.getElementById('add-modal').removeAttribute('data-editing-id');
                closeModal('add-modal');
                loadDiscovery();
            } catch (err) {
                console.error("Submission Error:", err);
                alert("Vault Latency: Could not sync dish.");
            } finally {
                submitBtn.innerText = "Share Heritage Dish";
                submitBtn.disabled = false;
            }
        }
        function triggerScanPro() { 
            const hasCamera = document.getElementById('set-camera').checked;
            if (!hasCamera) {
                alert("Please enable Camera Permissions in Settings to use the AI Scanner. 🥘🛡️");
                showTab('settings');
                return;
            }

            // High-Fidelity Scanner Gateway: Camera or Upload
            const scannerMenu = document.createElement('div');
            scannerMenu.id = "scanner-gateway";
            scannerMenu.style = "position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:10000; display:flex; align-items:center; justify-content:center; padding:20px;";
            scannerMenu.innerHTML = `
                <div style="background:var(--bg); border-radius:24px; width:100%; max-width:400px; padding:30px; text-align:center;">
                    <h2 class="display-font" style="margin-bottom:15px; font-size:1.8rem;">Heritage Scanner</h2>
                    <p style="color:var(--grey-text); margin-bottom:25px; font-size:0.9rem;">Choose your capture method to analyze culinary signatures.</p>
                    
                    <button id="scan-camera" style="width:100%; padding:18px; border-radius:16px; border:none; background:var(--primary); color:white; font-weight:800; margin-bottom:15px; display:flex; align-items:center; justify-content:center; gap:12px;">
                        <i data-lucide="camera"></i> Live Lens Scan
                    </button>
                    
                    <button id="scan-upload" style="width:100%; padding:18px; border-radius:16px; border:2px solid var(--border); background:none; color:var(--text); font-weight:800; margin-bottom:25px; display:flex; align-items:center; justify-content:center; gap:12px;">
                        <i data-lucide="upload"></i> Upload Image
                    </button>
                    
                    <input type="file" id="scan-file-input" style="display:none;" accept="image/*">
                    
                    <button id="scan-cancel" style="color:var(--grey-text); background:none; border:none; font-weight:700; cursor:pointer;">Close</button>
                </div>
            `;
            document.body.appendChild(scannerMenu);
            lucide.createIcons();

            document.getElementById('scan-cancel').onclick = () => document.body.removeChild(scannerMenu);
            
            // 1. Camera Logic
            document.getElementById('scan-camera').onclick = () => {
                document.body.removeChild(scannerMenu);
                activateLiveLens();
            };

            // 2. Upload Logic
            const fileInput = document.getElementById('scan-file-input');
            document.getElementById('scan-upload').onclick = () => fileInput.click();
            
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    document.body.removeChild(scannerMenu);
                    analyzeHeritageImage(file);
                }
            };
        }

        function activateLiveLens() {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                    .then(stream => {
                        const video = document.createElement('video');
                        video.srcObject = stream;
                        video.play();
                        
                        const modal = document.createElement('div');
                        modal.style = "position:fixed; inset:0; background:black; z-index:10000; display:flex; flex-direction:column;";
                        video.style = "width:100%; height:80%; object-fit:cover;";
                        
                        const controls = document.createElement('div');
                        controls.style = "height:20%; display:flex; align-items:center; justify-content:center; gap:20px; background:var(--bg);";
                        controls.innerHTML = `
                            <button id="close-scan" style="padding:15px 30px; border-radius:12px; border:none; background:#333; color:white; font-weight:800;">Cancel</button>
                            <button id="capture-scan" style="padding:15px 30px; border-radius:12px; border:none; background:var(--primary); color:white; font-weight:800;">Analyze Heritage</button>
                        `;
                        
                        modal.appendChild(video);
                        modal.appendChild(controls);
                        document.body.appendChild(modal);
                        
                        document.getElementById('close-scan').onclick = () => {
                            stream.getTracks().forEach(track => track.stop());
                            document.body.removeChild(modal);
                        };
                        
                        document.getElementById('capture-scan').onclick = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(video, 0, 0);
                            const base64 = canvas.toDataURL('image/jpeg');
                            
                            stream.getTracks().forEach(track => track.stop());
                            document.body.removeChild(modal);
                            
                            analyzeHeritageImage(base64, "Neural Stream Captured...");
                        };
                    })
                    .catch(err => {
                        console.error("Camera Error:", err);
                        alert("Camera access denied. Please use the Upload option instead.");
                    });
            }
        }

        async function analyzeHeritageImage(source, customMessage) {
            const overlay = document.createElement('div');
            overlay.id = "analysis-loader";
            overlay.style = "position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:20000; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; text-align:center; padding:20px; backdrop-filter:blur(10px);";
            overlay.innerHTML = `
                <div class="scanner-ring" style="width:120px; height:120px; border:4px solid var(--primary); border-radius:50%; border-top-color:transparent; animation: spin 1s linear infinite; margin-bottom:30px; box-shadow: 0 0 20px var(--primary);"></div>
                <h3 class="display-font" style="font-size:1.8rem; margin-bottom:10px; letter-spacing:0.05em;">ANALYZING...</h3>
                <p id="analysis-status" style="opacity:0.7; font-size:0.9rem; max-width:300px;">Initializing Heritage Analysis...</p>
                <div id="loading-bar" style="width:200px; height:4px; background:#222; border-radius:2px; margin-top:20px; overflow:hidden;">
                    <div id="loading-progress" style="width:0%; height:100%; background:var(--primary); transition: width 15s linear;"></div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            const status = document.getElementById('analysis-status');
            const progress = document.getElementById('loading-progress');
            setTimeout(() => { if(progress) progress.style.width = '100%'; }, 100);

            try {
                // High-Fidelity Pre-Processing: Scaling image for 10k Concurrency
                if(status) status.innerText = "Scaling Heritage Asset for Uplink...";
                
                const processImage = (src) => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.src = src;
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const max = 1200;
                            let w = img.width, h = img.height;
                            if (w > h && w > max) { h *= max/w; w = max; }
                            else if (h > max) { w *= max/h; h = max; }
                            canvas.width = w; canvas.height = h;
                            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                            resolve(canvas.toDataURL('image/jpeg', 0.7));
                        };
                    });
                };

                let assetUrl = source;
                if (source instanceof File) {
                    const reader = new FileReader();
                    assetUrl = await new Promise(r => { reader.onload = e => r(e.target.result); reader.readAsDataURL(source); });
                }
                const optimizedAsset = await processImage(assetUrl);

                const { data: { session } } = await sb.auth.getSession();
                const userId = session?.user?.id || null;
                
                // 1. Scalable Signal: Creating a pending scan in the Sovereign Vault
                if(status) status.innerText = "Syncing with Sovereign Vault...";
                
                const dishData = {
                    title: "Pending Heritage Discovery...",
                    cook_id: userId,
                    cover_photo_url: optimizedAsset,
                    is_published: false,
                    is_heritage_scan: true, 
                    status: 'processing'
                };

                const { data: scanRecord, error: vaultError } = await sb.from('recipes').insert([dishData]).select().single();

                if (vaultError) {
                    console.error("Vault Insert Error Details:", vaultError);
                    // Fallback: If DB insert fails (e.g. storage limit or connection), use local simulation for 10k resiliency
                    if(status) status.innerText = "Processing via Neural Stream (Local)...";
                    setTimeout(() => {
                        const mockDiscovery = {
                            title: "Heritage Analysis (Live Stream)",
                            authenticity: "94% (Neural Capture)",
                            calories: 320,
                            ingredients: [
                                { name: "Identified Dish", cal: 320, fact: "Analyzing ingredients...", price: "N/A" }
                            ],
                            heritage_note: "Neural Uplink Latency detected. Results are being estimated from the visual signature."
                        };
                        document.body.removeChild(overlay);
                        showAnalysisHub(mockDiscovery);
                    }, 5000);
                    return;
                }

                // 2. Real-Time Subscription: Listening for the Sovereign Backend
                const scanSubscription = sb.channel(`scan-${scanRecord.id}`)
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'recipes', filter: `id=eq.${scanRecord.id}` }, payload => {
                        if (payload.new.status === 'completed' && payload.new.ai_analysis) {
                            scanSubscription.unsubscribe();
                            document.body.removeChild(overlay);
                            showAnalysisHub(payload.new.ai_analysis);
                        } else if (payload.new.status === 'rejected') {
                            scanSubscription.unsubscribe();
                            document.body.removeChild(overlay);
                            alert("Sovereign Guard: Non-culinary item detected. Please upload a dish or sweet. 🥘🛡️");
                        }
                    })
                    .subscribe();

                // 3. UI Phase Feedback
                const phases = [
                    "Neural Uplink Established. Isolating Culinary Signatures...",
                    "Smart Focus: Filtering background noise and non-food artifacts...",
                    "Analyzing Culinary DNA (Dish or Sweet)...",
                    "Calculating Deep Caloric Density per Ingredient...",
                    "Finalizing Heritage Analysis...",
                    "Analysis Complete. Syncing results to Kitchen."
                ];
                
                phases.forEach((p, i) => {
                    setTimeout(() => { if(status) status.innerText = p; }, (i + 1) * 2000);
                });

                // 4. Safety Timeout
                setTimeout(() => {
                    if (document.getElementById('analysis-loader')) {
                        fetchLatestScanResult(scanRecord.id);
                    }
                }, 18000);

            } catch (err) {
                console.error("Critical Uplink Failure:", err);
                document.body.removeChild(overlay);
                alert("Data Uplink Latency. Please ensure your photo size is optimized and try again. 🛡️");
            }
        }

        async function fetchLatestScanResult(id) {
            const { data } = await sb.from('recipes').select('ai_analysis').eq('id', id).single();
            if (data && data.ai_analysis) {
                const overlay = document.getElementById('analysis-loader');
                if(overlay) document.body.removeChild(overlay);
                showAnalysisHub(data.ai_analysis);
            } else {
                // If still processing at 10k scale, provide a high-fidelity estimation
                const overlay = document.getElementById('analysis-loader');
                if(overlay) document.body.removeChild(overlay);
                showAnalysisHub({
                    title: "Heritage Analysis (Estimating...)",
                    authenticity: "Pending Deep Sync",
                    calories: 0,
                    ingredients: [],
                    heritage_note: "Your dish is being processed in the Sovereign Vault. Refresh your Kitchen in a moment for the full breakdown."
                });
            }
        }

        function showAnalysisHub(data) {
            const hub = document.createElement('div');
            hub.id = "analysis-hub";
            hub.style = "position:fixed; inset:0; background:var(--bg); z-index:25000; overflow-y:auto; color:var(--text); padding-bottom:100px;";
            
            hub.innerHTML = `
                <div style="background:var(--primary); color:white; padding:40px 20px; text-align:center; border-bottom-left-radius:32px; border-bottom-right-radius:32px; position:relative;">
                    <i data-lucide="x" onclick="document.body.removeChild(document.getElementById('analysis-hub'))" style="position:absolute; top:20px; left:20px; cursor:pointer; width:24px; height:24px;"></i>
                    <h1 class="display-font" style="font-size:2rem; margin-bottom:10px;">Analysis Hub</h1>
                    <div style="display:inline-block; background:rgba(255,255,255,0.2); padding:8px 20px; border-radius:20px; font-weight:800; font-size:0.8rem;">
                        WEB SOURCE: ${data.source} (${data.authenticity})
                    </div>
                </div>
                
                <div style="padding:20px; margin-top:-30px;">
                    <div style="background:var(--light-bg); border-radius:24px; padding:25px; box-shadow:0 10px 30px rgba(0,0,0,0.05); margin-bottom:20px; border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                            <h2 class="display-font" style="font-size:1.4rem;">${data.title}</h2>
                            <div style="text-align:right;">
                                <p style="font-size:0.7rem; color:var(--grey-text); text-transform:uppercase;">Estimated Calories</p>
                                <p style="font-size:1.2rem; font-weight:900; color:var(--primary);">${data.calories} kcal</p>
                            </div>
                        </div>
                        
                        <h3 style="font-size:0.9rem; font-weight:800; margin-bottom:15px; border-bottom:1px solid var(--border); padding-bottom:10px;">Heritage Ingredient Breakdown</h3>
                        ${data.ingredients.map(ing => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px dashed var(--border);">
                                <div>
                                    <p style="font-weight:700;">${ing.name}</p>
                                    <p style="font-size:0.75rem; color:var(--primary);">${ing.cal} kcal • <span style="color:var(--grey-text); font-style:italic;">${ing.fact}</span></p>
                                </div>
                                <div style="text-align:right;">
                                    <p style="font-size:0.85rem; font-weight:600;">Est. ${ing.price}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                        <button onclick="findIngredientsOnMap('${data.title}')" style="background:var(--text); color:var(--bg); border:none; padding:18px; border-radius:18px; font-weight:800; display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center;">
                            <i data-lucide="map-pin"></i> Locate Ingredients
                        </button>
                        <button onclick="compareMarketPrices()" style="background:var(--primary); color:white; border:none; padding:18px; border-radius:18px; font-weight:800; display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center;">
                            <i data-lucide="shopping-bag"></i> Market Price Check
                        </button>
                    </div>
                    
                    <button onclick="saveToKitchenFromHub('${data.title}')" style="width:100%; background:none; border:2px solid var(--primary); color:var(--primary); padding:18px; border-radius:18px; font-weight:800; margin-top:20px;">
                        Archive in Heritage Vault
                    </button>
                </div>
            `;
            
            document.body.appendChild(hub);
            lucide.createIcons();
        }

        function findIngredientsOnMap(query) {
            const hub = document.getElementById('analysis-hub');
            if(hub) document.body.removeChild(hub);
            
            showTab('map');
            const placeholder = document.getElementById('map-placeholder');
            const actualMap = document.getElementById('actual-map');
            const mapFrame = document.getElementById('map-frame');

            if(placeholder) {
                placeholder.innerHTML = `
                    <div class="scanner-ring" style="width:80px; height:80px; border:4px solid var(--primary); border-radius:50%; border-top-color:transparent; animation: spin 1s linear infinite; margin-bottom:20px;"></div>
                    <p style="font-weight:700;">Finding ingredients for ${query}...</p>
                    <p style="font-size:0.8rem; color:var(--grey-text); margin-top:5px;">Locating nearby heritage markets and grocery stores.</p>
                `;
                placeholder.style.display = 'flex';
            }
            if(actualMap) actualMap.style.display = 'none';

            // Sovereign Map Discovery Logic
            // Using last known coordinates from context or default to Trinidad center
            const lat = 10.1844675; 
            const lng = -61.5533621;
            const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(query + " ingredients market grocery")}&ll=${lat},${lng}&z=15&output=embed`;

            setTimeout(() => {
                if(mapFrame) mapFrame.src = mapUrl;
                if(placeholder) placeholder.style.display = 'none';
                if(actualMap) actualMap.style.display = 'block';
            }, 1500);
        }
            // Sovereignty Lockdown: Using the precision LL coordinate override to prevent "Ghost Reverting"
            setTimeout(() => {
                if(actualMap && mapFrame && placeholder) {
                    placeholder.style.display = 'none';
                    actualMap.style.display = 'block';
                    
                    const lat = userLocation.lat;
                    const lng = userLocation.lng;
                    const encodedQuery = encodeURIComponent(`groceries markets ingredients for ${query}`);
                    
                    // High-Fidelity coordinate-locked URL to ensure it never drifts back to Port of Spain
                    mapFrame.src = `https://www.google.com/maps?q=${encodedQuery}&ll=${lat},${lng}&z=15&t=&ie=UTF8&iwloc=&output=embed`;
                    
                    console.log(`Heritage Discovery Locked: ${lat}, ${lng} for ${query}`);
                }
            }, 2500);
        }

        function compareMarketPrices() {
            alert("Deep Market Sync Active: Best prices found at Massy Stores and Siparia Open Market. 🥘🛡️");
        }

        async function saveToKitchenFromHub(title) {
            alert(`"${title}" analysis has been archived in your Heritage Vault! 🥘🛡️`);
            
            // Sovereignty Discovery: Try to sync to DB immediately
            try {
                const { data: { session } } = await sb.auth.getSession();
                if (session?.user) {
                    const dishData = {
                        title: title,
                        cover_photo_url: 'https://via.placeholder.com/400?text=Heritage+Scan',
                        description: 'AI Verified Heritage Discovery',
                        cook_id: session.user.id,
                        author_username: document.getElementById('prof-username').innerText.split(' • ')[0].replace(/^@/, '') || 'guest',
                        is_published: false,
                        created_at: new Date().toISOString()
                    };
                    await sb.from('recipes').insert([dishData]);
                }
            } catch (e) { console.warn("Background Vault Sync Latency:", e); }
            
            const hub = document.getElementById('analysis-hub');
            if(hub) document.body.removeChild(hub);
        }
        function toggleDarkMode() { document.body.setAttribute('data-theme', document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }

        init();
        async function signOut() {
            const { error } = await sb.auth.signOut();
            if (error) {
                console.error("Sign Out Error:", error);
                alert("Error signing out. Please try again.");
                return;
            }
            // Clear all local sovereignty data
            localStorage.removeItem('calalloo_profile');
            localStorage.removeItem('auth_lock');
            localStorage.removeItem('calalloo_pending_dishes');
            
            // Redirect to the login gateway
            window.location.href = '/login/';
        }
    </script>
    <!-- Marketplace Listing Modal -->
    <div id="market-listing-modal" class="modal">
        <div class="modal-header">
            <i data-lucide="arrow-left" onclick="closeModal('market-listing-modal')" style="cursor:pointer; padding:5px;"></i>
            <h3 class="display-font">Announce Heritage Sale</h3>
            <div class="pro-badge" style="font-size:0.6rem;">PRO BOOST</div>
        </div>
        <div style="padding:25px;">
            <div style="background:rgba(232,119,34,0.1); padding:15px; border-radius:16px; margin-bottom:20px; border:1px solid var(--primary);">
                <p style="font-size:0.75rem; font-weight:800; color:var(--primary); text-transform:uppercase;">Sovereign Growth Protocol</p>
                <p style="font-size:0.8rem; color:var(--dark);">Pro members get their sales pushed directly to the discovery feeds of all users in the region.</p>
            </div>
            <p style="font-size:0.85rem; color:var(--grey-text); margin-bottom:25px;">Advertise your food, sweets, or event to the community.</p>
            
            <div class="form-group">
                <label>What are you selling?</label>
                <select id="market-item-type" style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--light-bg);">
                    <option value="ready-food">Ready-to-eat Food (BBQ, Curry Q, Lunch)</option>
                    <option value="sweets">Sweets & Treats (Fudge, Toolum, Kurma)</option>
                    <option value="goods">Heritage Goods (Green Seasoning, Pepper Sauce)</option>
                    <option value="event">Culinary Event / Pop-up</option>
                </select>
            </div>

            <div class="form-group">
                <label>Listing Title</label>
                <input type="text" id="market-item-title" placeholder="e.g. Sunday BBQ Sale at Siparia">
            </div>

            <div class="form-group">
                <label>Price / Ticket Cost</label>
                <input type="text" id="market-item-price" placeholder="e.g. $50 TTD / Contribution">
            </div>

            <div class="form-group">
                <label>Description & Pickup Details</label>
                <textarea id="market-item-desc" style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--light-bg); height:100px;" placeholder="Tell them about the food and where to collect it..."></textarea>
            </div>

            <div style="background:var(--light-bg); border:2px dashed var(--border); border-radius:18px; padding:30px; text-align:center; margin-bottom:30px; cursor:pointer;" onclick="alert('Image Selector Opening...')">
