import Select from 'react-select'

const countryCodes = [
  'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','CV','KH','CM','CA','CF','TD','CL','CN','CO','KM','CG','CD','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR','GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','KP','MK','NO','OM','PK','PW','PA','PG','PY','PE','PH','PL','PT','QA','RO','RU','RW','KN','LC','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','KR','SS','ES','LK','SD','SR','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VA','VE','VN','YE','ZM','ZW'
]

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

const countries = countryCodes
  .map((code) => ({ value: code, label: regionNames.of(code) ?? code }))
  .sort((firstCountry, secondCountry) => firstCountry.label.localeCompare(secondCountry.label))

function CountrySelect({ value, onChange, onBlur, error }) {
  const getDefaultCountry = () => {
    if (typeof navigator === 'undefined') return null
    const locale = navigator.language?.split('-')?.[1]?.toUpperCase()
    return countries.find((country) => country.value === locale) ?? null
  }

  return (
    <Select
      options={countries}
      value={value ?? getDefaultCountry()}
      onChange={onChange}
      onBlur={onBlur}
      isSearchable
      placeholder="Select your country"
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: 54,
          borderRadius: 18,
          borderColor: error ? '#ef4444' : state.isFocused ? '#57ff8c' : 'rgba(168, 219, 181, 0.75)',
          boxShadow: state.isFocused ? '0 0 0 4px rgba(87, 255, 140, 0.12)' : 'none',
          background: 'color-mix(in srgb, var(--color-bg-card) 82%, transparent)',
        }),
        menu: (base) => ({
          ...base,
          borderRadius: 18,
          overflow: 'hidden',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }),
        option: (base, state) => ({
          ...base,
          background: state.isFocused ? 'rgba(87, 255, 140, 0.14)' : 'transparent',
          color: 'var(--color-text-primary)',
        }),
        singleValue: (base) => ({ ...base, color: 'var(--color-text-primary)' }),
        input: (base) => ({ ...base, color: 'var(--color-text-primary)' }),
        placeholder: (base) => ({ ...base, color: 'var(--color-text-secondary)' }),
      }}
    />
  )
}

export { countries }
export default CountrySelect
