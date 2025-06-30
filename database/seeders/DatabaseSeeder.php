<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            RolesTableSeeder::class,
        ]);

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'role_id' => 1,
            'password' => Hash::make('admin123'),
            'credits' => 10000
        ]);

        User::factory()->create([
            'name' => 'Testing Customer',
            'email' => 'customer@gmail.com',
            'role_id' => 2,
            'password' => Hash::make('customer123'),
            'credits' => 10000
        ]);

        User::factory()->create([
            'name' => 'Testing Transcriptor',
            'email' => 'transcriptor@gmail.com',
            'role_id' => 4,
            'password' => Hash::make('transcriptor123'),
            'credits' => 10000
        ]);
    }
}
