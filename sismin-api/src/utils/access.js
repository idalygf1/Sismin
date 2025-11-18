export function getAllowedConcessionIds(user) {
  if (user.roleGlobal === 'propietario') return null;
  return (user.concessions || []).map(c => String(c._id ?? c));
}

export function resolveConcessionFilter(user, requestedId) {
  if (user.roleGlobal === 'propietario') {
    return {
      filter: requestedId ? { concession: requestedId } : {},
      concessionId: requestedId || null
    };
  }

  const allowed = getAllowedConcessionIds(user) || [];
  if (!allowed.length) {
    const err = new Error('Sin concesiones asignadas');
    err.status = 403;
    throw err;
  }

  if (requestedId) {
    if (!allowed.includes(String(requestedId))) {
      const err = new Error('Sin acceso a la concesión solicitada');
      err.status = 403;
      throw err;
    }
    return { filter: { concession: requestedId }, concessionId: requestedId };
  }

  if (allowed.length === 1) {
    return { filter: { concession: allowed[0] }, concessionId: allowed[0] };
  }

  return { filter: { concession: { $in: allowed } }, concessionId: allowed[0] };
}

export function ensureConcessionAccess(user, concessionId) {
  if (!concessionId) return true;
  if (user.roleGlobal === 'propietario') return true;
  const allowed = getAllowedConcessionIds(user) || [];
  return allowed.includes(String(concessionId));
}