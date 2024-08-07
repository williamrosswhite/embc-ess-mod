/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { CommunityCode } from '../../models/community-code';

export interface ConfigurationGetCountries$Params {}

export function configurationGetCountries(
  http: HttpClient,
  rootUrl: string,
  params?: ConfigurationGetCountries$Params,
  context?: HttpContext
): Observable<StrictHttpResponse<Array<CommunityCode>>> {
  const rb = new RequestBuilder(rootUrl, configurationGetCountries.PATH, 'get');
  if (params) {
  }

  return http.request(rb.build({ responseType: 'json', accept: 'application/json', context })).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<CommunityCode>>;
    })
  );
}

configurationGetCountries.PATH = '/api/Configuration/codes/countries';
