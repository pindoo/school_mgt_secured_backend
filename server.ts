
import app from './api/[...route]';

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`SchoolOS API listening on http://localhost:${port}`);
});
