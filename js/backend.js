const SUPABASE_URL = "https://sktpjacowqaedddtrhuz.supabase.co";
const SUPABASE_KEY = "{{credential:supabase-callaloo-dpanyard}}";

const supabase = {
    async request(path, options = {}) {
        const url = `${SUPABASE_URL}/rest/v1${path}`;
        const headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            ...options.headers
        };
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const error = await response.json();
            throw error;
        }
        return response.status === 204 ? null : await response.json();
    },

    auth: {
        generateId() {
            try {
                if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                    return crypto.randomUUID();
                }
            } catch (e) {}
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        loadProfile() {
            const user = this.getUser();
            if (!user) return;
            
            // UI elements update
            const nameEl = document.getElementById('userName');
            const bioEl = document.getElementById('userBio');
            const avatarEl = document.getElementById('userAvatar');
            const headerAvatarEl = document.getElementById('headerAvatar');
            
            if (nameEl) nameEl.innerText = user.full_name || "Specimen Alpha";
            if (bioEl) bioEl.innerText = user.bio || "Caribbean Heritage Enthusiast";
            
            const stats = {
                'statScans': user.scans || 0,
                'statFollowers': user.followers || 0,
                'statFollowing': user.following || 0
            };
            
            for (const [id, val] of Object.entries(stats)) {
                const el = document.getElementById(id);
                if (el) el.innerText = val;
            }

            if (user.avatar_url) {
                if (avatarEl) avatarEl.src = user.avatar_url;
                if (headerAvatarEl) headerAvatarEl.src = user.avatar_url;
            }
        },
        async signUp(email, password, fullName) {
            const user = { 
                id: this.generateId(), 
                email, 
                full_name: fullName,
                avatar_url: '',
                bio: 'Caribbean Heritage Enthusiast',
                scans: 0,
                followers: 0,
                following: 0,
                location: null
            };
            localStorage.setItem('calalloo_user', JSON.stringify(user));
            // In a real app, this would go to Supabase. 
            // For now, we persist in localStorage so it stays across sessions.
            return { user };
        },
        async signIn(email, password) {
            // Check if user exists in storage, otherwise mock for demo
            const stored = localStorage.getItem('calalloo_user');
            if (stored) return { user: JSON.parse(stored) };
            
            const user = { id: this.generateId(), email, full_name: "Specimen Alpha" };
            localStorage.setItem('calalloo_user', JSON.stringify(user));
            return { user };
        },
        updateUser(data) {
            const user = this.getUser();
            if (!user) return;
            const updated = { ...user, ...data };
            localStorage.setItem('calalloo_user', JSON.stringify(updated));
            return updated;
        },
        getUser() {
            const user = localStorage.getItem('calalloo_user');
            return user ? JSON.parse(user) : null;
        },
        signOut() {
            localStorage.removeItem('calalloo_user');
            window.location.href = '../login/';
        }
    },

    async getFeed() {
        return await this.request('/food_scans?select=*,profiles(id,avatar_url)&order=created_at.desc');
    },

    async uploadScan(scanData) {
        const user = this.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        return await this.request('/food_scans', {
            method: 'POST',
            body: JSON.stringify({ ...scanData, user_id: user.id })
        });
    }
};

window.backend = {
    signIn: async (email, password) => {
        try {
            const res = await supabase.auth.signIn(email, password);
            return { success: true, ...res };
        } catch (e) {
            return { success: false, error: e.message || "Uplink Failed" };
        }
    },
    signUp: async (email, password, fullName) => {
        try {
            const res = await supabase.auth.signUp(email, password, fullName);
            return { success: true, ...res };
        } catch (e) {
            return { success: false, error: e.message || "Initialization Failed" };
        }
    },
    getUser: () => supabase.auth.getUser(),
    signOut: () => supabase.auth.signOut()
};

const ThemeManager = {
    init() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        this.updateIcon(currentTheme);
    },
    toggle() {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateIcon(newTheme);
    },
    updateIcon(theme) {
        // Class-based theme management for modern toggles
    }
};
