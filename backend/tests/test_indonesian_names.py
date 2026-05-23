import pytest

from app.data.indonesian_names import (
    FEMALE_LAST_NAMES,
    FEMALE_NAMES,
    MALE_LAST_NAMES,
    MALE_NAMES,
    NEUTRAL_LAST_NAMES,
    get_random_names,
)


def _has_no_casefold_duplicates(items: list[str]) -> bool:
    keys = [item.casefold() for item in items]
    return len(keys) == len(set(keys))


def test_name_bank_is_large_enough():
    assert len(MALE_NAMES) >= 300
    assert len(FEMALE_NAMES) >= 300
    assert len(MALE_LAST_NAMES) >= 250
    assert len(FEMALE_LAST_NAMES) >= 300
    assert len(NEUTRAL_LAST_NAMES) >= 200


def test_name_bank_is_deduped_and_clean():
    for name_list in [MALE_NAMES, FEMALE_NAMES, MALE_LAST_NAMES, FEMALE_LAST_NAMES, NEUTRAL_LAST_NAMES]:
        assert _has_no_casefold_duplicates(name_list)
        assert all(item == item.strip() for item in name_list)
        assert all("  " not in item for item in name_list)


@pytest.mark.parametrize("gender", ["male", "female"])
def test_get_random_names_respects_requested_gender(gender: str):
    names = get_random_names(80, gender=gender)

    assert len(names) == 80
    assert {returned_gender for _, returned_gender in names} == {gender}
    assert all(" " in full_name for full_name, _ in names)


def test_get_random_names_avoids_duplicates_when_possible():
    names = get_random_names(250, gender="mixed")
    full_names = [full_name for full_name, _ in names]

    assert len(full_names) == 250
    assert len(full_names) == len(set(full_names))


def test_get_random_names_respects_blocked_names():
    blocked_names = {name for name, _ in get_random_names(40, gender="mixed")}
    names = get_random_names(80, gender="mixed", blocked_names=blocked_names)

    assert blocked_names.isdisjoint({name for name, _ in names})


def test_male_names_do_not_use_feminine_last_name_parts():
    feminine_parts = {"lestari", "sari", "rahayu", "safitri", "wulandari", "rahmawati", "pratiwi"}
    names = get_random_names(200, gender="male")

    for full_name, returned_gender in names:
        assert returned_gender == "male"
        assert feminine_parts.isdisjoint(part.casefold() for part in full_name.split()[1:])


def test_get_random_names_handles_empty_and_invalid_input():
    assert get_random_names(0) == []
    assert get_random_names(-10) == []

    with pytest.raises(ValueError):
        get_random_names(1, gender="unknown")
