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
        async signUp(email, password) {
            const user = { id: this.generateId(), email };
            localStorage.setItem('calalloo_user', JSON.stringify(user));
            await supabase.request('/profiles', {
                method: 'POST',
                body: JSON.stringify({ id: user.id, bio: "New Calalloo Member" })
            });
            return { user };
        },
        async signIn(email, password) {
            const user = { id: this.generateId(), email };
            localStorage.setItem('calalloo_user', JSON.stringify(user));
            return { user };
        },
        getUser() {
            const user = localStorage.getItem('calalloo_user');
            return user ? JSON.parse(user) : null;
        },
        signOut() {
            localStorage.removeItem('calalloo_user');
            window.location.href = '/login';
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
