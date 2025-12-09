
// Test script for @vercel/functions import
import { waitUntil } from '@vercel/functions';

console.log('waitUntil import successful:', typeof waitUntil);

try {
  waitUntil(new Promise(resolve => {
    console.log('Task started');
    setTimeout(() => {
      console.log('Task finished');
      resolve();
    }, 100);
  }));
  console.log('waitUntil call successful');
} catch (error) {
  console.error('waitUntil call failed:', error);
}
