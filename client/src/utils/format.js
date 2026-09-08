import { STATUS_FLOW, STATUS_VARIANTS } from '../constants/index.js';

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function bdt(n) {
  return `৳${Number(n || 0).toLocaleString('en-IN')}`;
}

export function distanceLabel(km) {
  if (km <= 0) return '< 1 km';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Number(km).toFixed(1)} km`;
}

export function statusStep(status) {
  const idx = STATUS_FLOW.indexOf(status);
  return idx === -1 ? -1 : idx;
}

export function statusClass(status) {
  return STATUS_VARIANTS[status] || 'neutral';
}

export function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
