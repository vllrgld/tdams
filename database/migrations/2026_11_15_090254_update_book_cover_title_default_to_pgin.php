<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('books')->where('cover_title', 'Tax Declaration')->update([
            'cover_title' => 'PGIN',
        ]);
    }

    public function down(): void
    {
        DB::table('books')->where('cover_title', 'PGIN')->update([
            'cover_title' => 'Tax Declaration',
        ]);
    }
};
