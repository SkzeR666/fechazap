import { z } from 'zod';
import { protectCpf } from '@/src/lib/crypto';
import { adminDb } from '@/src/lib/supabase';
import { apiError } from '@/src/server/http';

const schema = z.object({ name: z.string().trim().min(2).max(120), cpf: z.string().transform((v) => v.replace(/\D/g, '')).pipe(z.string().length(11)) });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const [{ token }, body] = await Promise.all([params, request.json().then((value) => schema.parse(value))]);
    const cpf = protectCpf(body.cpf);
    const { data, error } = await adminDb().rpc('accept_quote', {
      p_public_token: token, accepter_name: body.name, cpf_ciphertext: cpf.cpfCiphertext,
      cpf_hash: cpf.cpfHash, cpf_last4: cpf.cpfLast4,
      source_ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      source_user_agent: request.headers.get('user-agent'),
    });
    if (error) return Response.json({ error: 'acceptance_failed', detail: error.message }, { status: 409 });
    return Response.json(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
