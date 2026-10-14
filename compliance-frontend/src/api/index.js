import axios from 'axios';

const BASE = 'http://localhost:3001/api';

export const getShipments   = ()    => axios.get(`${BASE}/shipments`);
export const createShipment = (d)   => axios.post(`${BASE}/shipments`, d);
export const getAlerts      = (id)  => axios.get(`${BASE}/alerts?shipment_id=${id}`);
export const resolveAlert   = (id)  => axios.patch(`${BASE}/alerts/${id}/resolve`);
export const getMatrix      = (id)  => axios.get(`${BASE}/shipments/${id}/matrix`);
export const uploadDoc      = (fd)  => axios.post(`${BASE}/upload`, fd, {
  headers: { 'Content-Type': 'multipart/form-data' }
});