<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EvaluationRecordController;
use App\Http\Controllers\Api\InnovationController;
use App\Http\Controllers\Api\KeywordController;
use App\Http\Controllers\Api\ManuscriptSubmissionController;
use App\Http\Controllers\Api\ManuscriptRevisionController;
use App\Http\Controllers\Api\ScalabilityFrameworkController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Middleware\AuthenticateApiToken;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

Route::middleware(AuthenticateApiToken::class)->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::put('/admin/users/{user}', [AdminUserController::class, 'update']);
    Route::post('/admin/users/{user}/reset-password', [AdminUserController::class, 'resetPassword']);

    Route::get('/innovations', [InnovationController::class, 'index']);
    Route::post('/innovations', [InnovationController::class, 'store']);
    Route::get('/innovations/{innovation}', [InnovationController::class, 'show']);
    Route::delete('/innovations/{innovation}', [InnovationController::class, 'destroy']);

    Route::get('/keywords', [KeywordController::class, 'index']);
    Route::post('/keywords', [KeywordController::class, 'store']);

    Route::get('/evaluations', [EvaluationRecordController::class, 'index']);
    Route::post('/evaluations', [EvaluationRecordController::class, 'store']);
    Route::get('/evaluations/{innovation}', [EvaluationRecordController::class, 'show']);
    Route::match(['put', 'patch'], '/evaluations/{innovation}', [EvaluationRecordController::class, 'update']);
    Route::delete('/evaluations/{innovation}', [EvaluationRecordController::class, 'destroy']);

    Route::get('/scalability-framework', ScalabilityFrameworkController::class);

    Route::post('/uploads', [UploadController::class, 'store']);
    Route::post('/manuscripts/submit', ManuscriptSubmissionController::class);
    Route::post('/manuscripts/{innovation}/revise', ManuscriptRevisionController::class);
});
