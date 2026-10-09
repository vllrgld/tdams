<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('previous_tax_declaration_number')->nullable();
            $table->string('title_number')->nullable();
            $table->string('property_location_street')->nullable();
            $table->string('property_location_barangay')->nullable();
            $table->string('property_location_district')->nullable();
            $table->string('property_location_municipality')->nullable();
            $table->string('owner_address_street')->nullable();
            $table->string('owner_address_barangay')->nullable();
            $table->string('owner_address_district')->nullable();
            $table->string('owner_address_city_municipality')->nullable();
            $table->string('province')->nullable();
            $table->string('pin')->nullable()->index();
            $table->string('boundary_north')->nullable();
            $table->string('boundary_south')->nullable();
            $table->string('boundary_east')->nullable();
            $table->string('boundary_west')->nullable();
            $table->decimal('area', 14, 4)->nullable();
            $table->text('remarks')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn([
                'previous_tax_declaration_number',
                'title_number',
                'property_location_street',
                'property_location_barangay',
                'property_location_district',
                'property_location_municipality',
                'owner_address_street',
                'owner_address_barangay',
                'owner_address_district',
                'owner_address_city_municipality',
                'province',
                'pin',
                'boundary_north',
                'boundary_south',
                'boundary_east',
                'boundary_west',
                'area',
                'remarks',
            ]);
        });
    }
};
