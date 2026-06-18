import api from './axios';

// GET /api/admin/stats — dashboard metrics
export const fetchAdminStats = async () => {
    const res = await api.get('/admin/stats');
    return res.data;
};

// GET /api/admin/users — paginated user list
export const fetchAdminUsers = async ({ search = '', page = 1, limit = 20 } = {}) => {
    const res = await api.get('/admin/users', { params: { search, page, limit } });
    return res.data;
};

// PATCH /api/admin/users/:id — update user (ban/unban, role, coins)
export const updateAdminUser = async (userId, { status, role, coinsDelta } = {}) => {
    const body = {};
    if (status) body.status = status;
    if (role) body.role = role;
    if (typeof coinsDelta === 'number') body.coinsDelta = coinsDelta;
    const res = await api.patch(`/admin/users/${userId}`, body);
    return res.data;
};

// DELETE /api/admin/users/:id — soft delete
export const deleteAdminUser = async (userId) => {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
};

// GET /api/admin/sessions — recent sessions audit log
export const fetchAdminSessions = async ({ page = 1, limit = 30, gameId, result } = {}) => {
    const params = { page, limit };
    if (gameId) params.gameId = gameId;
    if (result) params.result = result;
    const res = await api.get('/admin/sessions', { params });
    return res.data;
};