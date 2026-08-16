/**
 * Poydevor sahifasi. 1-bosqichda kirish ekrani bilan almashtiriladi.
 * Hozircha bitta vazifasi bor: loyiha va baza tirikligini ko'rsatish.
 */
import { bazaTirikmi } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Sahifa() {
  const baza = await bazaTirikmi();

  return (
    <main>
      <h1 style={{ marginBottom: '0.25rem' }}>Jalyuzi ERP</h1>
      <p style={{ color: '#666', marginTop: 0 }}>0-bosqich — poydevor</p>

      <table style={{ borderCollapse: 'collapse', marginTop: '1.5rem' }}>
        <tbody>
          <tr>
            <td style={{ padding: '0.35rem 1.5rem 0.35rem 0' }}>Dastur</td>
            <td>ishlayapti</td>
          </tr>
          <tr>
            <td style={{ padding: '0.35rem 1.5rem 0.35rem 0' }}>Baza</td>
            <td>{baza ? 'ulandi' : 'ulanmadi — docker compose up -d baza'}</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
