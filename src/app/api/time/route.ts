export async function GET() {
  const now = new Date();
  const formatTime = (timeZone: string) =>
    new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone,
    }).format(now);

  return Response.json(
    {
      serverTimeMs: now.getTime(),
      utcTime: formatTime('UTC'),
      ktmTime: formatTime('Asia/Kathmandu'),
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}