import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from various possible locations
const paths = [
  path.join(process.cwd(), ".env"),
  path.join(process.cwd(), "apps/api/.env"),
  path.join(__dirname, "..", ".env"),
];

for (const p of paths) {
  dotenv.config({ path: p });
}

import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
  
  app.enableCors();
  const port = process.env.PORT || 4000;
  await app.listen(port, "0.0.0.0");
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
