import Axios, { AxiosResponse } from 'axios';
import { from, interval, Observable, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { url } from '../common/types';

export abstract class Scraper<T> {
  /**
   * Abstract Scraper class to ensure stabile interface between site scrapers
   */

  protected requestsIntervalMs = 1000;
  protected abstract normalizer: (data: any, url: url) => T;

  public scrap(urls?: Array<url>): Observable<Array<T>> {
    return new Observable((subscriber) => {
      new Promise((resolve, reject) => {
        urls ? resolve(urls) : this.getAllUrls().then((urls) => resolve(urls));
      }).then((response) => {
        const urls = response as Array<url>; // TODO: figure out how to remove AS
        const delayer = interval(this.requestsIntervalMs);
        const urlsObservable = zip(from(urls), delayer).pipe(map(([url]) => url));
        urlsObservable.subscribe({
          next: (url) => this.getNormalizedData(url).then((normalizedData) => subscriber.next([normalizedData])),
          complete: () => setTimeout(() => subscriber.complete(), this.requestsIntervalMs),
        });
      });
    });
  }

  private async getNormalizedData(url: url): Promise<T> {
    const response: AxiosResponse = await Axios.get(url);
    return this.normalizer(response.data, url);
  }

  protected abstract async getAllUrls(): Promise<Array<url>>;
}
