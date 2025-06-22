import React from 'react';
import { 
  AcademicCapIcon, 
  BuildingOffice2Icon, 
  LightBulbIcon,
  RocketLaunchIcon,
  UserIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

const About: React.FC = () => {
  const stats = [
    { name: 'Years of AI Innovation', value: '5+' },
    { name: 'Enterprise Clients', value: '100+' },
    { name: 'AI Models Deployed', value: '50+' },
    { name: 'Success Rate', value: '99%' },
  ];

  const values = [
    {
      name: 'Innovation First',
      description: 'We push the boundaries of what\'s possible with artificial intelligence.',
      icon: LightBulbIcon,
    },
    {
      name: 'Enterprise Grade',
      description: 'Security, reliability, and compliance are built into every solution.',
      icon: BuildingOffice2Icon,
    },
    {
      name: 'Client Success',
      description: 'Your success is our mission. We partner with you for long-term growth.',
      icon: RocketLaunchIcon,
    },
    {
      name: 'Continuous Learning',
      description: 'We stay ahead of AI trends to deliver cutting-edge solutions.',
      icon: AcademicCapIcon,
    },
  ];

  return (
    <section id="about" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-dreamer-blue">About Us</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-dreamer-dark sm:text-4xl">
            Pioneering the Future of AI Solutions
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            At Dreamer AI Solutions, we transform visionary ideas into intelligent, practical solutions 
            that drive real business results for law firms and enterprises.
          </p>
        </div>

        {/* Stats */}
        <div className="mx-auto max-w-4xl">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 mb-20">
            {stats.map((stat, index) => (
              <div 
                key={stat.name} 
                className="flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <dt className="text-sm font-medium leading-6 text-gray-600">{stat.name}</dt>
                <dd className="mt-2 text-3xl font-bold leading-10 tracking-tight text-dreamer-blue">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Our Story */}
        <div className="mx-auto max-w-6xl mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold tracking-tight text-dreamer-dark mb-6">
              Our Story
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From vision to reality - how Dreamer AI Solutions became the trusted AI partner for leading enterprises
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2 items-center mb-12">
            <div>
              <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
                <h4 className="text-xl font-semibold text-dreamer-dark mb-4">The Genesis</h4>
                <p className="text-gray-600 mb-4">
                  Founded with a vision to democratize artificial intelligence for enterprises, 
                  Dreamer AI Solutions emerged from the recognition that powerful AI shouldn't be 
                  exclusive to tech giants. Our founder, J. LaSalle, witnessed firsthand how 
                  traditional businesses struggled to harness AI's potential.
                </p>
                <p className="text-gray-600">
                  Starting with a single client in 2019, we've grown to serve over 100 enterprise 
                  clients, maintaining a 99% client satisfaction rate while pioneering new 
                  approaches to AI implementation.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-w-4 aspect-h-3 bg-gradient-to-br from-dreamer-blue to-blue-600 rounded-lg p-8 text-white">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <LightBulbIcon className="h-16 w-16 mx-auto mb-4 animate-pulse" />
                    <h4 className="text-xl font-semibold mb-2">Innovation in Action</h4>
                    <p className="text-blue-100">
                      Transforming complex challenges into intelligent solutions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2 items-center mb-12">
            <div className="lg:order-2">
              <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
                <h4 className="text-xl font-semibold text-dreamer-dark mb-4">Our Specialization</h4>
                <p className="text-gray-600 mb-4">
                  We specialize in creating bespoke AI solutions that integrate seamlessly with 
                  existing workflows, particularly in the legal and professional services sectors 
                  where precision, security, and reliability are paramount. Our deep industry 
                  knowledge allows us to understand the unique challenges facing modern law firms.
                </p>
                <p className="text-gray-600">
                  From document automation to predictive analytics, we've helped transform how 
                  legal professionals work, saving thousands of hours while improving accuracy 
                  and client outcomes.
                </p>
              </div>
            </div>
            <div className="lg:order-1">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg p-8 text-white">
                <div className="text-center">
                  <BuildingOffice2Icon className="h-16 w-16 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold mb-2">Enterprise Focus</h4>
                  <p className="text-green-100">
                    Dedicated to serving the unique needs of professional services
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 lg:p-12">
            <h4 className="text-xl font-semibold text-dreamer-dark mb-6 text-center">Our Technology Philosophy</h4>
            <p className="text-lg text-gray-600 mb-6 text-center max-w-4xl mx-auto">
              Our proprietary Dreamer AI technology stack combines the latest advances in 
              machine learning, natural language processing, and automation to deliver 
              solutions that truly understand and enhance your business processes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-dreamer-blue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">AI</span>
                </div>
                <h5 className="font-medium text-gray-900 mb-2">Advanced AI</h5>
                <p className="text-sm text-gray-600">Cutting-edge machine learning models</p>
              </div>
              <div className="text-center">
                <div className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">NLP</span>
                </div>
                <h5 className="font-medium text-gray-900 mb-2">Natural Language</h5>
                <p className="text-sm text-gray-600">Human-like text understanding</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">Auto</span>
                </div>
                <h5 className="font-medium text-gray-900 mb-2">Automation</h5>
                <p className="text-sm text-gray-600">Intelligent process optimization</p>
              </div>
            </div>
          </div>
        </div>

        {/* Founder Section */}
        <div className="mx-auto max-w-6xl mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold tracking-tight text-dreamer-dark mb-4">
              Meet Our Founder & CEO
            </h3>
            <p className="text-xl text-gray-600">
              The visionary behind Dreamer AI Solutions
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-100">
            <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-3 items-start">
              <div className="lg:col-span-1">
                <div className="text-center">
                  <div className="aspect-w-1 aspect-h-1 bg-gradient-to-br from-dreamer-blue to-blue-600 rounded-full w-56 h-56 mx-auto flex items-center justify-center shadow-2xl">
                    <UserIcon className="h-28 w-28 text-white" />
                  </div>
                  <div className="mt-6">
                    <h4 className="text-2xl font-bold text-dreamer-dark mb-2">
                      J. LaSalle
                    </h4>
                    <p className="text-lg text-dreamer-blue font-semibold mb-4">
                      Founder & CEO
                    </p>
                    <a
                      href="https://www.linkedin.com/in/jlasalle973"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-dreamer-blue text-white rounded-lg hover:bg-blue-600 font-medium transition-all transform hover:scale-105"
                    >
                      <LinkIcon className="h-5 w-5 mr-2" />
                      Connect on LinkedIn
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <div className="space-y-8">
                  <div>
                    <h5 className="text-xl font-semibold text-dreamer-dark mb-4">Leadership & Vision</h5>
                    <p className="text-gray-600 mb-4">
                      A visionary leader in artificial intelligence and enterprise solutions, 
                      J. LaSalle brings over a decade of experience in transforming traditional business 
                      processes through innovative AI implementations. With a unique combination of 
                      technical expertise and business acumen, J. has positioned Dreamer AI Solutions 
                      as the go-to partner for law firms and enterprises seeking competitive advantages 
                      through intelligent automation.
                    </p>
                    <p className="text-gray-600">
                      Under J.'s leadership, Dreamer AI Solutions has achieved remarkable growth, 
                      serving over 100 enterprise clients with a 99% satisfaction rate while 
                      maintaining the highest standards of security and compliance required by 
                      the legal industry.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                      <h6 className="font-semibold text-dreamer-dark mb-3 flex items-center">
                        <AcademicCapIcon className="h-5 w-5 mr-2 text-dreamer-blue" />
                        Expertise
                      </h6>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• AI Strategy & Implementation</li>
                        <li>• Enterprise Software Architecture</li>
                        <li>• Legal Technology Innovation</li>
                        <li>• Business Process Optimization</li>
                        <li>• Data Security & Compliance</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                      <h6 className="font-semibold text-dreamer-dark mb-3 flex items-center">
                        <RocketLaunchIcon className="h-5 w-5 mr-2 text-green-500" />
                        Achievements
                      </h6>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Founded Dreamer AI Solutions (2019)</li>
                        <li>• 100+ Enterprise Clients Served</li>
                        <li>• 50+ AI Models Deployed</li>
                        <li>• Industry Recognition for Innovation</li>
                        <li>• Thought Leader in Legal AI</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-dreamer-blue to-blue-600 rounded-xl p-6 text-white">
                    <h6 className="font-semibold mb-3">Philosophy</h6>
                    <blockquote className="text-blue-100 italic">
                      "AI should empower human potential, not replace it. My mission is to create 
                      intelligent solutions that enhance how professionals work, making them more 
                      efficient, accurate, and focused on what matters most - serving their clients."
                    </blockquote>
                    <p className="text-blue-200 text-sm mt-3">- J. LaSalle, Founder & CEO</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold tracking-tight text-dreamer-dark mb-4">
              Our Values
            </h3>
            <p className="text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </div>
          
          <dl className="grid max-w-none grid-cols-1 gap-8 lg:grid-cols-2">
            {values.map((value, index) => (
              <div 
                key={value.name} 
                className="relative bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <dt>
                  <div className="absolute flex h-12 w-12 items-center justify-center rounded-lg bg-dreamer-blue text-white">
                    <value.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg font-semibold leading-7 text-dreamer-dark">
                    {value.name}
                  </p>
                </dt>
                <dd className="ml-16 mt-2 text-base text-gray-600">
                  {value.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* CTA Section */}
        <div className="mx-auto max-w-2xl text-center mt-20">
          <div className="bg-gradient-to-r from-dreamer-blue to-blue-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Business?</h3>
            <p className="text-blue-100 mb-6">
              Let's discuss how Dreamer AI Solutions can help you unlock new possibilities.
            </p>
            <a
              href="#contact"
              className="inline-block bg-white text-dreamer-blue px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105"
            >
              Start Your AI Journey
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;