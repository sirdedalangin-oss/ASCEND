<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,docx,txt,md', 'max:20480'],
        ]);

        $path = $request->file('file')->store('manuscripts', 'public');

        return response()->json([
            'file_url' => Storage::url($path),
            'original_name' => $request->file('file')->getClientOriginalName(),
        ], 201);
    }
}
