import Axios, { AxiosResponse } from 'axios';
import { from, interval, Observable, zip } from 'rxjs';
import { map } from 'rxjs/operators';

export abstract class Scraper<T> {
  /**
   * Abstract Scraper class to ensure stabile interface between site scrapers
   */

  protected requestsIntervalMs = 1000;
  protected abstract normalizer: (data: any, url: string) => T;

  public scrap(urls?: Array<string>): Observable<Array<T>> {
    return new Observable((subscriber) => {
      console.log("Gathering urls...")
      new Promise((resolve, reject) => {
        urls ? resolve(urls) : this.getAllUrls().then((urls) => resolve(urls));
      }).then((response) => {
        const urls = response as Array<string>; // TODO: figure out how to remove AS
        console.log(`Gathered ${urls.length} urls.`);
        const delayer = interval(this.requestsIntervalMs);
        const urlsObservable = zip(from(urls), delayer).pipe(map(([url]) => url));
        let completed = 1;
        urlsObservable.subscribe({
          next: async (url) => {
            console.log(`${completed}/${urls.length} Gathering data from ${url}`);
            const normalizedData = await this.getNormalizedData(url);
            subscriber.next([normalizedData]);
          },
          complete: () => setTimeout(() => subscriber.complete(), this.requestsIntervalMs),
        });
      });
    });
  }

  private async getNormalizedData(url: string): Promise<T> {
    const response: AxiosResponse = await Axios.get(url);
    return this.normalizer(response.data, url);
  }

  protected abstract async getAllUrls(): Promise<Array<string>>;
}
