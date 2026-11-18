import { Link } from '@tanstack/react-router';
import { Box } from 'lucide-react';
export function Brand() { return <Link to="/" className="logo" aria-label="MenuVision, início"><span className="logo-mark"><Box size={33} strokeWidth={1.8} /></span><span>Menu<span>Vision</span></span></Link>; }
