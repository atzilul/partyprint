'use client';
import {useEffect, useState} from 'react';
import {responsePromiseMessage} from '@/lib/response-promise';

export default function ResponsePromise() {
  const [message, setMessage] = useState(() => responsePromiseMessage());
  useEffect(() => {
    const update = () => setMessage(responsePromiseMessage());
    const timer = window.setInterval(update, 60_000);
    update();
    return () => window.clearInterval(timer);
  }, []);
  return <p className="pp-response-promise" role="status">{message}</p>;
}
