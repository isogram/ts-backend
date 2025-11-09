import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { TracingService } from './tracing.service';
import { LoggerService } from '@shared/modules/logger/logger.service';

@Injectable()
export class TracedHttpService {
    constructor(
        private readonly httpService: HttpService,
        private readonly logger: LoggerService,
    ) { }

    /**
     * Add tracing headers to the request config
     */
    private enrichRequestWithTracing(config: AxiosRequestConfig = {}): AxiosRequestConfig {
        const tracingHeaders = TracingService.getTracingHeaders();

        // Merge tracing headers with existing headers
        const enrichedConfig = {
            ...config,
            headers: {
                ...config.headers,
                ...tracingHeaders,
            },
        };

        // Log outgoing request with trace info
        const traceId = TracingService.getTraceId();
        const method = (config.method || 'GET').toUpperCase();
        const url = config.url || 'unknown';

        this.logger.debug(`[${traceId}] Outgoing HTTP ${method} ${url}`, 'TracedHttpService');

        return enrichedConfig;
    }

    /**
     * Make a GET request with tracing headers
     */
    get<T = any>(url: string, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
        const enrichedConfig = this.enrichRequestWithTracing({ ...config, method: 'GET', url });
        return this.httpService.get<T>(url, enrichedConfig);
    }

    /**
     * Make a POST request with tracing headers
     */
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
        const enrichedConfig = this.enrichRequestWithTracing({ ...config, method: 'POST', url });
        return this.httpService.post<T>(url, data, enrichedConfig);
    }

    /**
     * Make a PUT request with tracing headers
     */
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
        const enrichedConfig = this.enrichRequestWithTracing({ ...config, method: 'PUT', url });
        return this.httpService.put<T>(url, data, enrichedConfig);
    }

    /**
     * Make a PATCH request with tracing headers
     */
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
        const enrichedConfig = this.enrichRequestWithTracing({ ...config, method: 'PATCH', url });
        return this.httpService.patch<T>(url, data, enrichedConfig);
    }

    /**
     * Make a DELETE request with tracing headers
     */
    delete<T = any>(url: string, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
        const enrichedConfig = this.enrichRequestWithTracing({ ...config, method: 'DELETE', url });
        return this.httpService.delete<T>(url, enrichedConfig);
    }

    /**
     * Make a HEAD request with tracing headers
     */
    head<T = any>(url: string, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
        const enrichedConfig = this.enrichRequestWithTracing({ ...config, method: 'HEAD', url });
        return this.httpService.head<T>(url, enrichedConfig);
    }

    /**
     * Make a request with custom method and tracing headers
     */
    request<T = any>(config: AxiosRequestConfig): Observable<AxiosResponse<T>> {
        const enrichedConfig = this.enrichRequestWithTracing(config);
        return this.httpService.request<T>(enrichedConfig);
    }

    /**
     * Get the underlying axios instance with tracing interceptor
     */
    getAxiosRef() {
        const axiosRef = this.httpService.axiosRef;

        // Add request interceptor to inject tracing headers
        axiosRef.interceptors.request.use(
            (config) => {
                const tracingHeaders = TracingService.getTracingHeaders();

                // Safely add tracing headers
                Object.keys(tracingHeaders).forEach(key => {
                    config.headers.set(key, tracingHeaders[key]);
                });

                // Log the request
                const traceId = TracingService.getTraceId();
                const method = (config.method || 'GET').toUpperCase();
                this.logger.debug(`[${traceId}] Axios interceptor: ${method} ${config.url}`, 'TracedHttpService');

                return config;
            },
            (error) => {
                const traceId = TracingService.getTraceId();
                this.logger.error(`[${traceId}] Axios request error: ${error.message}`, error.stack, 'TracedHttpService');
                return Promise.reject(error);
            }
        );

        // Add response interceptor for logging
        axiosRef.interceptors.response.use(
            (response) => {
                const traceId = TracingService.getTraceId();
                const method = (response.config.method || 'GET').toUpperCase();
                this.logger.debug(
                    `[${traceId}] HTTP ${method} ${response.config.url} - ${response.status}`,
                    'TracedHttpService'
                );
                return response;
            },
            (error) => {
                const traceId = TracingService.getTraceId();
                const method = error.config ? (error.config.method || 'GET').toUpperCase() : 'UNKNOWN';
                const url = error.config?.url || 'unknown';
                const status = error.response?.status || 'no-status';

                this.logger.error(
                    `[${traceId}] HTTP ${method} ${url} - ${status} - ${error.message}`,
                    error.stack,
                    'TracedHttpService'
                );
                return Promise.reject(error);
            }
        );

        return axiosRef;
    }
}