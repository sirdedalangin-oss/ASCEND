<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Keyword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class KeywordController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'categories' => Keyword::CATEGORIES,
            'keywords' => Keyword::query()->orderBy('category')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = Validator::make($request->all(), [
            'name' => ['required', 'string', 'min:2', 'max:60'],
            'category' => ['required', Rule::in(array_keys(Keyword::CATEGORIES))],
        ])->validate();
        $name = Str::lower(Str::squish($data['name']));
        $slug = Str::slug($name);

        if ($slug === '') {
            return response()->json(['message' => 'Enter a keyword containing letters or numbers.'], 422);
        }

        $keyword = Keyword::firstOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'category' => $data['category']],
        );

        return response()->json($keyword, $keyword->wasRecentlyCreated ? 201 : 200);
    }
}
