<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sim extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'operator',
        'sim_number',
        'status',
        'balance',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
        ];
    }

    public function balanceHistories(): HasMany
    {
        return $this->hasMany(SimBalanceHistory::class);
    }

    /**
     * Valid operator values.
     */
    public const OPERATORS = [
        'grameenphone' => 'গ্রামীণফোন',
        'robi' => 'রবি',
        'banglalink' => 'বাংলালিংক',
        'airtel' => 'এয়ারটেল',
        'teletalk' => 'টেলিটক',
    ];

    /**
     * Valid status values.
     */
    public const STATUSES = [
        'active' => 'সক্রিয়',
        'inactive' => 'নিষ্ক্রিয়',
    ];
}
