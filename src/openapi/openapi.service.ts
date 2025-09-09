import { Injectable } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';

@Injectable()
export class OpenApiService {
  private doc?: OpenAPIObject;
  set(doc: OpenAPIObject) { this.doc = doc; }
  get(): OpenAPIObject {
    if (!this.doc) throw new Error('OpenAPI document not set yet');
    return this.doc;
  }
}
