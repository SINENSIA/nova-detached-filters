<?php

namespace Outl1ne\NovaDetachedFilters;

use Laravel\Nova\Makeable;

class DetachedFilterTabGroup
{
    use Makeable;

    public $isTabGroup = true;
    public $name;
    public $filters;
    public $width;

    public function __construct(string $name, array $filters = [], string $width = 'w-auto')
    {
        $this->name = $name;
        $this->filters = $filters;
        $this->width = $width;
    }

    public function jsonSerialize(): array
    {
        return [
            'isTabGroup' => true,
            'name' => $this->name,
            'width' => $this->width,
            'filters' => collect($this->filters)->map(function ($filter) {
                return $filter->jsonSerialize();
            })->all(),
        ];
    }
}
