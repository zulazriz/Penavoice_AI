<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DolbyService
{
    private string $apiUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->apiUrl = env('DOLBY_API_URL', 'https://api.dolby.com');
        $this->apiKey = env('DOLBY_API_KEY');
    }

    public function getUploadUrl()
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
        ])->post("{$this->apiUrl}/media/input");

        return $response->json();
    }

    public function startEnhancement(string $inputUrl, string $outputUrl)
    {
        return Http::withHeaders([
            'x-api-key' => $this->apiKey,
        ])->post("{$this->apiUrl}/media/enhance", [
            "input" => $inputUrl,
            "output" => $outputUrl,
            "audio" => [
                "loudness" => [
                    "enable" => true,
                ],
                "noise" => [
                    "enable" => true,
                ],
            ],
        ])->json();
    }

    public function getEnhancementStatus(string $jobId)
    {
        return Http::withHeaders([
            'x-api-key' => $this->apiKey,
        ])->get("{$this->apiUrl}/media/enhance", [
            'job_id' => $jobId,
        ])->json();
    }
}
