export const isSameUsername = (left: string | null, right: string | null) => {
    if (!left || !right) return false
    return left.toLowerCase() === right.toLowerCase()
}

export const getDisplayName = (username: string | null, userId: string, currentUsername: string | null) => {
    if (isSameUsername(username, currentUsername)) {
        return 'Me'
    }
    return username ?? userId
}
