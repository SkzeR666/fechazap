import { describe,expect,it } from 'vitest';import { whatsappUrl } from '../src/lib/whatsapp';
describe('WhatsApp deep link',()=>{it('normalizes phone and encodes text',()=>{expect(whatsappUrl('+55 (11) 99999-0000','Olá & tudo bem?')).toBe('https://wa.me/5511999990000?text=Ol%C3%A1%20%26%20tudo%20bem%3F')})});
