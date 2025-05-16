private handleAuthentication(response: AuthResponse): void {
    console.log('[AuthService] 📥 Handling authentication response:', response);

    const { user, token } = response;
    const expiresIn = response.expiresIn || 15 * 60; // Default to 15 minutes if not provided

    // Ensure user has a roles array
    if (!user.roles) {
      console.log(
        '[AuthService] No roles array in user data, checking role object'
      );
      user.roles = [];

      // Try to get role from role object if present
      if (
        'role' in user &&
        user.role &&
        typeof user.role === 'object' &&
        'name' in user.role
      ) {
        const roleObj = user.role as { name: string };
        console.log('[AuthService] Found role in role object:', roleObj.name);
        // Store role in uppercase for consistent comparison
        user.roles.push(roleObj.name.toUpperCase());
      }
    } else if (user.roles.length > 0) {
      // Convert role names to uppercase for consistency
      user.roles = user.roles.map(role => role.toUpperCase());
      console.log('[AuthService] Normalized user roles to uppercase:', user.roles);
    }

    // Verify that roles array is not empty
    if (!user.roles || user.roles.length === 0) {
      console.warn('[AuthService] ⚠️ User has no roles - navigation may fail');
    } else {
      console.log('[AuthService] User roles:', user.roles);
    }

    // Calculate expiration
    // ... existing code ...
} 