import app from './api/index';

const port = Number(process.env.PORT || 3001);

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`SchoolOS API listening on http://localhost:${port}`);
  });
}

export default app;
