/** Local display slots only. This never changes public players or the server seat order. */
export function gameSeatOrder(ids: readonly string[], viewerId: string, sheriffId: string | null, previous?: readonly string[]) {
  const viewerIndex = ids.indexOf(viewerId);
  const base = viewerIndex < 0 ? [...ids] : [...ids.slice(viewerIndex), ...ids.slice(0, viewerIndex)];
  const order = previous?.length === ids.length && previous[0] === viewerId && previous.every(id => ids.includes(id)) ? [...previous] : base;
  const top = topSeatIndex(ids.length);
  if (sheriffId && sheriffId !== viewerId) {
    const index = order.indexOf(sheriffId);
    if (index > 0) [order[top], order[index]] = [order[index], order[top]];
  }
  return order;
}
export function topSeatIndex(count: number) { return count === 6 ? 3 : 2; }
export function gameSeatPositions(count: number) {
  const degrees = count === 4 ? [90, 180, 270, 360] : count === 5 ? [90, 180, 270, 330, 390] : [90, 150, 210, 270, 330, 390];
  const values = degrees.map(degree => ({ x: Math.cos(degree * Math.PI / 180), y: Math.sin(degree * Math.PI / 180) }));
  const left = Math.max(...values.map(value => -value.x)), right = Math.max(...values.map(value => value.x));
  return values.map(value => ({ x: Number((value.x / (value.x < 0 ? left : right)).toFixed(5)), y: Number(value.y.toFixed(5)) }));
}
